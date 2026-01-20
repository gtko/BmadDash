use crate::models::*;
use chrono::{DateTime, Utc};
use regex::Regex;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;
use walkdir::WalkDir;

#[derive(Error, Debug)]
pub enum ParseError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("YAML parse error: {0}")]
    Yaml(#[from] serde_yaml::Error),
    #[error("Invalid BMAD structure: {0}")]
    InvalidStructure(String),
}

pub struct BmadParser;

impl BmadParser {
    /// Detect if a directory contains a BMAD project
    pub fn is_bmad_project(path: &Path) -> bool {
        // Check for standard BMAD directories
        let bmad_docs = path.join("bmad-docs");
        let dot_bmad = path.join(".bmad");
        let docs = path.join("docs");

        if bmad_docs.exists() || dot_bmad.exists() {
            return true;
        }

        // Check for docs/ with BMAD artifacts
        if docs.exists() {
            // Check for sprint-status.yaml anywhere in docs/
            for entry in WalkDir::new(&docs).max_depth(3) {
                if let Ok(entry) = entry {
                    if entry.file_name() == "sprint-status.yaml" {
                        return true;
                    }
                    if entry.file_name() == "epics.md" {
                        return true;
                    }
                }
            }
        }

        false
    }

    /// Find the BMAD docs directory in a project
    pub fn find_bmad_docs_dir(project_path: &Path) -> Option<PathBuf> {
        let bmad_docs = project_path.join("bmad-docs");
        if bmad_docs.exists() {
            return Some(bmad_docs);
        }

        let dot_bmad = project_path.join(".bmad");
        if dot_bmad.exists() {
            return Some(dot_bmad);
        }

        // Check docs/ folder structure (planning-artifacts, implementation-artifacts)
        let docs = project_path.join("docs");
        if docs.exists() {
            return Some(docs);
        }

        None
    }

    /// Parse a BMAD project from a directory
    pub fn parse_project(project_path: &Path, custom_bmad_dir: Option<&Path>) -> Result<BmadProject, ParseError> {
        let bmad_dir = if let Some(custom_dir) = custom_bmad_dir {
            if !custom_dir.exists() {
                return Err(ParseError::InvalidStructure(format!(
                    "Custom BMAD docs directory does not exist: {}",
                    custom_dir.display()
                )));
            }
            custom_dir.to_path_buf()
        } else {
            Self::find_bmad_docs_dir(project_path)
                .ok_or_else(|| ParseError::InvalidStructure("No bmad-docs directory found".into()))?
        };

        let project_name = project_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown Project")
            .to_string();

        let now = Utc::now().to_rfc3339();
        let id = uuid::Uuid::new_v4().to_string();

        // Parse sprint status if exists (check multiple locations)
        let (sprint_status, sprint_status_time) = Self::parse_sprint_status(&bmad_dir, &now)?;

        // Parse documents
        let documents = Self::parse_documents(&bmad_dir, &now)?;

        // Parse epics
        let mut epics = Self::parse_epics(&bmad_dir, &sprint_status, &now)?;

        // Parse user story files and attach them to epics
        let stories_by_epic = Self::parse_story_files(&bmad_dir, &sprint_status, &now)?;
        Self::attach_story_files(&mut epics, stories_by_epic, &sprint_status, &now);

        // Determine current phase based on sprint status and documents
        let current_phase = Self::determine_phase(&documents, &epics, &sprint_status);
        let last_activity =
            Self::latest_activity(&documents, &epics, sprint_status_time.as_deref(), &now);
        let created_at =
            Self::earliest_activity(&documents, &epics, sprint_status_time.as_deref(), &now);

        Ok(BmadProject {
            id,
            name: project_name,
            path: project_path.to_string_lossy().to_string(),
            bmad_docs_path: bmad_dir.to_string_lossy().to_string(),
            description: None,
            current_phase,
            epics,
            documents,
            sprint_status,
            last_activity,
            created_at,
        })
    }

    /// Parse sprint-status.yaml - handles multiple formats
    fn parse_sprint_status(
        bmad_dir: &Path,
        now: &str,
    ) -> Result<(Option<SprintStatus>, Option<String>), ParseError> {
        // Try multiple locations for sprint-status.yaml
        let possible_paths = vec![
            bmad_dir.join("sprint-status.yaml"),
            bmad_dir.join("implementation-artifacts/sprint-status.yaml"),
            bmad_dir.join("stories/sprint-status.yaml"),
        ];

        let status_path = possible_paths.into_iter().find(|p| p.exists());

        let status_path = match status_path {
            Some(p) => p,
            None => return Ok((None, None)),
        };
        let status_time = Self::file_time_or_now(&status_path, now);

        let content = fs::read_to_string(&status_path)?;
        let yaml: serde_yaml::Value = serde_yaml::from_str(&content)?;

        let generated = yaml
            .get("generated")
            .and_then(|v| v.as_str().or_else(|| v.as_i64().map(|_| "")).map(|s| s.to_string()))
            .unwrap_or_default();
        let project = yaml
            .get("project")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let project_key = yaml
            .get("project_key")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let tracking_system = yaml
            .get("tracking_system")
            .and_then(|v| v.as_str())
            .unwrap_or("file-based")
            .to_string();
        let story_location = yaml
            .get("story_location")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let mut development_status: HashMap<String, EpicSprintStatus> = HashMap::new();

        // Parse development_status - handles FLAT structure where stories are at root level
        if let Some(dev_status) = yaml.get("development_status").and_then(|v| v.as_mapping()) {
            // First pass: identify epics and their stories
            let mut epic_stories: HashMap<String, HashMap<String, StoryStatus>> = HashMap::new();
            let mut epic_statuses: HashMap<String, EpicStatus> = HashMap::new();
            let mut epic_retrospectives: HashMap<String, RetrospectiveStatus> = HashMap::new();

            for (key, val) in dev_status {
                if let Some(key_str) = key.as_str() {
                    if let Some(status_str) = val.as_str() {
                        if key_str.starts_with("epic-") && !key_str.contains("-retrospective") {
                            // This is an epic status entry like "epic-1: in-progress"
                            epic_statuses.insert(
                                key_str.to_string(),
                                Self::parse_epic_status(status_str),
                            );
                        } else if key_str.ends_with("-retrospective") {
                            // This is a retrospective entry like "epic-1-retrospective: optional"
                            let epic_key = key_str.replace("-retrospective", "");
                            let retro_status = if status_str == "done" {
                                RetrospectiveStatus::Done
                            } else {
                                RetrospectiveStatus::Optional
                            };
                            epic_retrospectives.insert(epic_key, retro_status);
                        } else {
                            // This is a story entry like "1-1-project-setup: done"
                            // Extract epic number from the story key
                            let parts: Vec<&str> = key_str.split('-').collect();
                            if let Some(epic_num_str) = parts.first() {
                                if let Ok(epic_num) = epic_num_str.parse::<u32>() {
                                    let epic_key = format!("epic-{}", epic_num);
                                    let story_status = Self::parse_story_status(status_str);

                                    epic_stories
                                        .entry(epic_key)
                                        .or_insert_with(HashMap::new)
                                        .insert(key_str.to_string(), story_status);
                                }
                            }
                        }
                    } else if val.is_mapping() {
                        // Nested format: epic-1: { status: in-progress, 1-1-story: done }
                        let status = val
                            .get("status")
                            .and_then(|v| v.as_str())
                            .map(|s| Self::parse_epic_status(s))
                            .unwrap_or(EpicStatus::Backlog);

                        epic_statuses.insert(key_str.to_string(), status);

                        let mut stories: HashMap<String, StoryStatus> = HashMap::new();
                        if let Some(mapping) = val.as_mapping() {
                            for (story_key, story_val) in mapping {
                                if let (Some(sk), Some(sv)) = (story_key.as_str(), story_val.as_str()) {
                                    if sk != "status" && sk != "retrospective" {
                                        stories.insert(sk.to_string(), Self::parse_story_status(sv));
                                    }
                                }
                            }
                        }

                        if let Some(retro) = val.get("retrospective").and_then(|v| v.as_str()) {
                            let retro_status = if retro == "done" {
                                RetrospectiveStatus::Done
                            } else {
                                RetrospectiveStatus::Optional
                            };
                            epic_retrospectives.insert(key_str.to_string(), retro_status);
                        }

                        epic_stories.insert(key_str.to_string(), stories);
                    }
                }
            }

            // Build final development_status structure
            for (epic_key, status) in &epic_statuses {
                let stories = epic_stories.remove(epic_key).unwrap_or_default();
                let retrospective = epic_retrospectives.get(epic_key).cloned();

                development_status.insert(
                    epic_key.clone(),
                    EpicSprintStatus {
                        status: status.clone(),
                        stories,
                        retrospective,
                    },
                );
            }

            // Also add any epics that only have stories (no explicit status)
            for (epic_key, stories) in epic_stories {
                if !development_status.contains_key(&epic_key) {
                    development_status.insert(
                        epic_key.clone(),
                        EpicSprintStatus {
                            status: EpicStatus::Backlog,
                            stories,
                            retrospective: None,
                        },
                    );
                }
            }
        }

        Ok((
            Some(SprintStatus {
            generated,
            project,
            project_key,
            tracking_system,
            story_location,
            development_status,
            }),
            Some(status_time),
        ))
    }

    fn parse_epic_status(s: &str) -> EpicStatus {
        match s {
            "in-progress" => EpicStatus::InProgress,
            "done" => EpicStatus::Done,
            _ => EpicStatus::Backlog,
        }
    }

    fn parse_story_status(s: &str) -> StoryStatus {
        match s {
            "ready-for-dev" => StoryStatus::ReadyForDev,
            "in-progress" => StoryStatus::InProgress,
            "review" => StoryStatus::Review,
            "done" => StoryStatus::Done,
            _ => StoryStatus::Backlog,
        }
    }

    /// Parse all documents from bmad-docs
    fn parse_documents(bmad_dir: &Path, now: &str) -> Result<Vec<BmadDocument>, ParseError> {
        let mut documents = Vec::new();

        // Look for common BMAD documents in multiple locations
        let doc_patterns = vec![
            ("prd.md", "prd"),
            ("product-requirements.md", "prd"),
            ("architecture.md", "architecture"),
            ("tech-spec.md", "tech-spec"),
            ("ux-design.md", "ux-design"),
            ("project-context.md", "project-context"),
        ];

        // Check root level
        for (filename, doc_type) in &doc_patterns {
            let file_path = bmad_dir.join(filename);
            if file_path.exists() {
                if let Ok(doc) = Self::create_document(&file_path, doc_type, now) {
                    documents.push(doc);
                }
            }
        }

        // Check planning-artifacts/
        let planning_dir = bmad_dir.join("planning-artifacts");
        if planning_dir.exists() {
            for (filename, doc_type) in &doc_patterns {
                let file_path = planning_dir.join(filename);
                if file_path.exists() {
                    if let Ok(doc) = Self::create_document(&file_path, doc_type, now) {
                        documents.push(doc);
                    }
                }
            }
        }

        // Check solutioning-artifacts/
        let solutioning_dir = bmad_dir.join("solutioning-artifacts");
        if solutioning_dir.exists() {
            for (filename, doc_type) in &doc_patterns {
                let file_path = solutioning_dir.join(filename);
                if file_path.exists() {
                    if let Ok(doc) = Self::create_document(&file_path, doc_type, now) {
                        documents.push(doc);
                    }
                }
            }
        }

        // Also walk subdirectories for other markdown files
        for entry in WalkDir::new(bmad_dir).max_depth(3) {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.extension().map(|e| e == "md").unwrap_or(false) {
                    let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

                    // Skip already processed and epic files
                    if doc_patterns.iter().any(|(f, _)| *f == filename) {
                        continue;
                    }
                    if filename == "epics.md" || filename.starts_with("epic-") {
                        continue;
                    }
                    // Skip story files (pattern: N-N-*.md)
                    let story_pattern = Regex::new(r"^\d+-\d+-.+\.md$").unwrap();
                    if story_pattern.is_match(filename) {
                        continue;
                    }

                    // Skip duplicates by path
                    let path_str = path.to_string_lossy().to_string();
                    if documents.iter().any(|d| d.file_path == path_str) {
                        continue;
                    }

                    if let Ok(doc) = Self::create_document(path, "other", now) {
                        documents.push(doc);
                    }
                }
            }
        }

        Ok(documents)
    }

    fn create_document(path: &Path, doc_type: &str, now: &str) -> Result<BmadDocument, ParseError> {
        let content = fs::read_to_string(path)?;
        let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        let title = Self::extract_title_from_markdown(&content)
            .unwrap_or_else(|| filename.replace(".md", ""));
        let file_time = Self::file_time_or_now(path, now);

        Ok(BmadDocument {
            id: uuid::Uuid::new_v4().to_string(),
            doc_type: doc_type.to_string(),
            title,
            content,
            file_path: path.to_string_lossy().to_string(),
            metadata: serde_json::Value::Null,
            created_at: file_time.clone(),
            updated_at: file_time,
        })
    }

    fn file_time_or_now(path: &Path, now: &str) -> String {
        fs::metadata(path)
            .and_then(|meta| meta.modified())
            .ok()
            .map(|time| DateTime::<Utc>::from(time).to_rfc3339())
            .unwrap_or_else(|| now.to_string())
    }

    fn parse_rfc3339(value: &str) -> Option<DateTime<Utc>> {
        DateTime::parse_from_rfc3339(value)
            .ok()
            .map(|dt| dt.with_timezone(&Utc))
    }

    fn merge_latest(current: &mut Option<DateTime<Utc>>, candidate: DateTime<Utc>) {
        match current {
            Some(existing) => {
                if candidate > *existing {
                    *current = Some(candidate);
                }
            }
            None => {
                *current = Some(candidate);
            }
        }
    }

    fn merge_earliest(current: &mut Option<DateTime<Utc>>, candidate: DateTime<Utc>) {
        match current {
            Some(existing) => {
                if candidate < *existing {
                    *current = Some(candidate);
                }
            }
            None => {
                *current = Some(candidate);
            }
        }
    }

    fn latest_activity(
        documents: &[BmadDocument],
        epics: &[Epic],
        sprint_status_time: Option<&str>,
        fallback: &str,
    ) -> String {
        let mut latest = Self::parse_rfc3339(fallback);

        for doc in documents {
            if let Some(dt) = Self::parse_rfc3339(&doc.updated_at) {
                Self::merge_latest(&mut latest, dt);
            }
        }

        for epic in epics {
            if let Some(dt) = Self::parse_rfc3339(&epic.updated_at) {
                Self::merge_latest(&mut latest, dt);
            }
            for story in &epic.stories {
                if let Some(dt) = Self::parse_rfc3339(&story.updated_at) {
                    Self::merge_latest(&mut latest, dt);
                }
            }
        }

        if let Some(time) = sprint_status_time {
            if let Some(dt) = Self::parse_rfc3339(time) {
                Self::merge_latest(&mut latest, dt);
            }
        }

        latest
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_else(|| fallback.to_string())
    }

    fn earliest_activity(
        documents: &[BmadDocument],
        epics: &[Epic],
        sprint_status_time: Option<&str>,
        fallback: &str,
    ) -> String {
        let mut earliest = Self::parse_rfc3339(fallback);

        for doc in documents {
            if let Some(dt) = Self::parse_rfc3339(&doc.created_at) {
                Self::merge_earliest(&mut earliest, dt);
            }
        }

        for epic in epics {
            if let Some(dt) = Self::parse_rfc3339(&epic.created_at) {
                Self::merge_earliest(&mut earliest, dt);
            }
            for story in &epic.stories {
                if let Some(dt) = Self::parse_rfc3339(&story.created_at) {
                    Self::merge_earliest(&mut earliest, dt);
                }
            }
        }

        if let Some(time) = sprint_status_time {
            if let Some(dt) = Self::parse_rfc3339(time) {
                Self::merge_earliest(&mut earliest, dt);
            }
        }

        earliest
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_else(|| fallback.to_string())
    }

    fn is_epic_newer(candidate: &Epic, existing: &Epic) -> bool {
        match (
            Self::parse_rfc3339(&candidate.updated_at),
            Self::parse_rfc3339(&existing.updated_at),
        ) {
            (Some(candidate_dt), Some(existing_dt)) => candidate_dt > existing_dt,
            (Some(_), None) => true,
            (None, Some(_)) => false,
            (None, None) => false,
        }
    }

    fn merge_epics_by_number(epics: Vec<Epic>) -> Vec<Epic> {
        let mut by_number: HashMap<u32, Epic> = HashMap::new();

        for epic in epics {
            match by_number.get(&epic.number) {
                Some(existing) => {
                    if Self::is_epic_newer(&epic, existing) {
                        by_number.insert(epic.number, epic);
                    }
                }
                None => {
                    by_number.insert(epic.number, epic);
                }
            }
        }

        by_number.into_values().collect()
    }

    fn merge_epic_stories(target: &mut Epic, source: &Epic) {
        if target.stories.is_empty() {
            target.stories = source.stories.clone();
            return;
        }

        let mut seen: HashSet<String> = target
            .stories
            .iter()
            .map(|story| story.number.clone())
            .collect();

        for story in &source.stories {
            if seen.insert(story.number.clone()) {
                target.stories.push(story.clone());
            }
        }

        target
            .stories
            .sort_by(|a, b| a.number.cmp(&b.number));
    }

    fn attach_story_files(
        epics: &mut Vec<Epic>,
        stories_by_epic: HashMap<u32, Vec<Story>>,
        sprint_status: &Option<SprintStatus>,
        now: &str,
    ) {
        let mut by_number: HashMap<u32, usize> = epics
            .iter()
            .enumerate()
            .map(|(index, epic)| (epic.number, index))
            .collect();

        for (epic_number, mut stories) in stories_by_epic {
            stories.sort_by(|a, b| a.number.cmp(&b.number));

            if let Some(&index) = by_number.get(&epic_number) {
                epics[index].stories = stories;
            } else {
                let (status, retrospective) =
                    Self::epic_status_from_sprint(sprint_status, epic_number);
                let (created_at, updated_at) =
                    Self::story_times(&stories, now);

                epics.push(Epic {
                    id: uuid::Uuid::new_v4().to_string(),
                    number: epic_number,
                    title: format!("Epic {}", epic_number),
                    goal: String::new(),
                    stories,
                    status,
                    retrospective,
                    file_path: None,
                    created_at,
                    updated_at,
                });
                by_number.insert(epic_number, epics.len() - 1);
            }
        }
    }

    fn epic_status_from_sprint(
        sprint_status: &Option<SprintStatus>,
        epic_number: u32,
    ) -> (EpicStatus, Option<RetrospectiveStatus>) {
        let epic_key = format!("epic-{}", epic_number);
        sprint_status
            .as_ref()
            .and_then(|ss| ss.development_status.get(&epic_key))
            .map(|es| (es.status.clone(), es.retrospective.clone()))
            .unwrap_or((EpicStatus::Backlog, None))
    }

    fn story_times(stories: &[Story], fallback: &str) -> (String, String) {
        let mut earliest = Self::parse_rfc3339(fallback);
        let mut latest = Self::parse_rfc3339(fallback);

        for story in stories {
            if let Some(dt) = Self::parse_rfc3339(&story.created_at) {
                Self::merge_earliest(&mut earliest, dt);
            }
            if let Some(dt) = Self::parse_rfc3339(&story.updated_at) {
                Self::merge_latest(&mut latest, dt);
            }
        }

        (
            earliest
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_else(|| fallback.to_string()),
            latest
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_else(|| fallback.to_string()),
        )
    }

    /// Parse epics from bmad-docs
    fn parse_epics(
        bmad_dir: &Path,
        sprint_status: &Option<SprintStatus>,
        now: &str,
    ) -> Result<Vec<Epic>, ParseError> {
        let mut epics = Vec::new();

        // Prefer epic-*.md files over epics.md
        let epics_dir = bmad_dir.join("epics");
        if epics_dir.exists() {
            epics.extend(Self::parse_epics_from_dir(&epics_dir, sprint_status, now)?);
        }

        epics.extend(Self::parse_epic_files_from_dir(bmad_dir, sprint_status, now)?);

        let epics = Self::merge_epics_by_number(epics);
        let mut by_number: HashMap<u32, Epic> =
            epics.into_iter().map(|epic| (epic.number, epic)).collect();

        // Supplement stories from epics.md if needed
        let epics_file_paths = vec![
            bmad_dir.join("epics.md"),
            bmad_dir.join("planning-artifacts/epics.md"),
            bmad_dir.join("epics/epics.md"),
        ];

        let mut epics_from_docs = Vec::new();
        for epics_file in epics_file_paths {
            if epics_file.exists() {
                let content = fs::read_to_string(&epics_file)?;
                epics_from_docs.extend(Self::parse_epics_from_single_file(
                    &content,
                    &epics_file,
                    sprint_status,
                    now,
                )?);
            }
        }

        for epic in Self::merge_epics_by_number(epics_from_docs) {
            if !by_number.contains_key(&epic.number) {
                by_number.insert(epic.number, epic);
            }
        }

        let mut merged = by_number.into_values().collect::<Vec<_>>();
        merged.sort_by_key(|e| e.number);
        Ok(merged)
    }

    /// Parse all epics from a single epics.md file
    fn parse_epics_from_single_file(
        content: &str,
        file_path: &Path,
        sprint_status: &Option<SprintStatus>,
        now: &str,
    ) -> Result<Vec<Epic>, ParseError> {
        let mut epics = Vec::new();
        let file_time = Self::file_time_or_now(file_path, now);

        // Regex for epic headers: "### Epic N: Title" or "## Epic N: Title"
        let epic_header_regex = Regex::new(r"(?m)^#{2,3}\s+Epic\s+(\d+):\s*(.+)$").unwrap();

        // Split content by epic headers
        let mut epic_sections: Vec<(u32, String, String)> = Vec::new();
        let mut last_end = 0;

        for cap in epic_header_regex.captures_iter(content) {
            let full_match = cap.get(0).unwrap();
            let epic_num: u32 = cap.get(1).unwrap().as_str().parse().unwrap_or(0);
            let epic_title = cap.get(2).unwrap().as_str().trim().to_string();

            if epic_num > 0 {
                // Find the content between this header and the next epic header
                let start = full_match.end();
                let next_epic = epic_header_regex.find(&content[start..]);
                let end = match next_epic {
                    Some(m) => start + m.start(),
                    None => content.len(),
                };

                let section_content = content[start..end].to_string();
                epic_sections.push((epic_num, epic_title, section_content));
                last_end = end;
            }
        }

        // Parse each epic section
        for (epic_num, title, section_content) in epic_sections {
            let epic_key = format!("epic-{}", epic_num);

            // Get status from sprint status
            let (status, retrospective) = sprint_status
                .as_ref()
                .and_then(|ss| ss.development_status.get(&epic_key))
                .map(|es| (es.status.clone(), es.retrospective.clone()))
                .unwrap_or((EpicStatus::Backlog, None));

            // Extract goal
            let goal = Self::extract_section(&section_content, "Goal")
                .or_else(|| Self::extract_section(&section_content, "User Outcome"))
                .unwrap_or_default();

            // Parse stories from this epic section
            let stories =
                Self::parse_stories_from_content(&section_content, epic_num, sprint_status, &file_time);

            epics.push(Epic {
                id: uuid::Uuid::new_v4().to_string(),
                number: epic_num,
                title,
                goal,
                stories,
                status,
                retrospective,
                file_path: Some(file_path.to_string_lossy().to_string()),
                created_at: file_time.clone(),
                updated_at: file_time.clone(),
            });
        }

        Ok(epics)
    }

    fn parse_epics_from_dir(
        epics_dir: &Path,
        sprint_status: &Option<SprintStatus>,
        now: &str,
    ) -> Result<Vec<Epic>, ParseError> {
        let mut epics = Vec::new();

        for entry in fs::read_dir(epics_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().map(|e| e == "md").unwrap_or(false) {
                let content = fs::read_to_string(&path)?;
                if let Some(epic) = Self::parse_epic_file(path.as_path(), &content, sprint_status, now)? {
                    epics.push(epic);
                }
            }
        }

        epics.sort_by_key(|e| e.number);
        Ok(epics)
    }

    fn parse_epic_files_from_dir(
        bmad_dir: &Path,
        sprint_status: &Option<SprintStatus>,
        now: &str,
    ) -> Result<Vec<Epic>, ParseError> {
        let mut epics = Vec::new();

        for entry in fs::read_dir(bmad_dir)? {
            let entry = entry?;
            let path = entry.path();

            if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                if filename.starts_with("epic") && path.extension().map(|e| e == "md").unwrap_or(false) {
                    let content = fs::read_to_string(&path)?;
                    if let Some(epic) = Self::parse_epic_file(&path, &content, sprint_status, now)? {
                        epics.push(epic);
                    }
                }
            }
        }

        Ok(epics)
    }

    fn parse_epic_file(
        path: &Path,
        content: &str,
        sprint_status: &Option<SprintStatus>,
        now: &str,
    ) -> Result<Option<Epic>, ParseError> {
        let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

        // Extract epic number from filename (e.g., "epic-1.md" or "epic-1-title.md")
        let epic_num_regex = Regex::new(r"epic-?(\d+)").unwrap();
        let epic_number = epic_num_regex
            .captures(filename)
            .and_then(|c| c.get(1))
            .and_then(|m| m.as_str().parse::<u32>().ok())
            .unwrap_or(0);

        if epic_number == 0 {
            return Ok(None);
        }

        let title = Self::extract_title_from_markdown(content)
            .unwrap_or_else(|| format!("Epic {}", epic_number));

        let goal = Self::extract_section(content, "Goal")
            .or_else(|| Self::extract_section(content, "Objective"))
            .unwrap_or_default();

        let file_time = Self::file_time_or_now(path, now);
        let stories = Self::parse_stories_from_content(content, epic_number, sprint_status, &file_time);

        let epic_key = format!("epic-{}", epic_number);
        let (status, retrospective) = sprint_status
            .as_ref()
            .and_then(|ss| ss.development_status.get(&epic_key))
            .map(|es| (es.status.clone(), es.retrospective.clone()))
            .unwrap_or((EpicStatus::Backlog, None));

        Ok(Some(Epic {
            id: uuid::Uuid::new_v4().to_string(),
            number: epic_number,
            title,
            goal,
            stories,
            status,
            retrospective,
            file_path: Some(path.to_string_lossy().to_string()),
            created_at: file_time.clone(),
            updated_at: file_time,
        }))
    }

    fn parse_story_files(
        bmad_dir: &Path,
        sprint_status: &Option<SprintStatus>,
        now: &str,
    ) -> Result<HashMap<u32, Vec<Story>>, ParseError> {
        let mut stories_by_epic: HashMap<u32, Vec<Story>> = HashMap::new();
        let story_file_regex = Regex::new(r"^(\d+)-(\d+)-.+\.md$").unwrap();

        for entry in WalkDir::new(bmad_dir).max_depth(4) {
            if let Ok(entry) = entry {
                let path = entry.path();
                if !path.is_file() {
                    continue;
                }

                let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                let caps = match story_file_regex.captures(filename) {
                    Some(caps) => caps,
                    None => continue,
                };

                let epic_number = caps
                    .get(1)
                    .and_then(|m| m.as_str().parse::<u32>().ok())
                    .unwrap_or(0);
                let story_number = caps
                    .get(2)
                    .and_then(|m| m.as_str().parse::<u32>().ok())
                    .unwrap_or(0);

                if epic_number == 0 || story_number == 0 {
                    continue;
                }

                let content = fs::read_to_string(path)?;
                if let Some(story) = Self::parse_story_file(
                    path,
                    &content,
                    epic_number,
                    story_number,
                    sprint_status,
                    now,
                ) {
                    stories_by_epic
                        .entry(epic_number)
                        .or_default()
                        .push(story);
                }
            }
        }

        Ok(stories_by_epic)
    }

    fn parse_story_file(
        path: &Path,
        content: &str,
        epic_number: u32,
        story_number: u32,
        sprint_status: &Option<SprintStatus>,
        now: &str,
    ) -> Option<Story> {
        let file_time = Self::file_time_or_now(path, now);
        let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        let story_key = filename.trim_end_matches(".md");
        let story_number_str = format!("{}.{}", epic_number, story_number);

        let title = Self::extract_title_from_markdown(content).unwrap_or_else(|| {
            Self::story_title_from_filename(story_key, epic_number, story_number)
        });

        let (user_type, capability, value_benefit) = Self::extract_user_story_details(content);
        let status =
            Self::story_status_from_sprint(sprint_status, epic_number, story_number, Some(story_key));

        Some(Story {
            id: uuid::Uuid::new_v4().to_string(),
            epic_id: String::new(),
            number: story_number_str,
            title,
            user_type,
            capability,
            value_benefit,
            acceptance_criteria: Vec::new(),
            status,
            tasks: Vec::new(),
            file_path: Some(path.to_string_lossy().to_string()),
            created_at: file_time.clone(),
            updated_at: file_time,
        })
    }

    fn story_title_from_filename(filename: &str, epic_number: u32, story_number: u32) -> String {
        let prefix = format!("{}-{}-", epic_number, story_number);
        let cleaned = filename
            .trim_start_matches(&prefix)
            .replace('-', " ")
            .trim()
            .to_string();

        if cleaned.is_empty() {
            format!("Story {}.{}", epic_number, story_number)
        } else {
            cleaned
        }
    }

    fn extract_user_story_details(content: &str) -> (String, String, String) {
        let user_story_regex = Regex::new(
            r"(?s)\*\*As\s+(?:a|an)\*\*\s+(.+?),?\s*\*\*I\s+want\*\*\s+(.+?),?\s*\*\*[Ss]o\s+that\*\*\s+(.+?)(?:\n\n|\*\*)"
        ).unwrap();

        user_story_regex
            .captures(content)
            .map(|c| {
                (
                    c.get(1)
                        .map(|m| m.as_str().trim().to_string())
                        .unwrap_or_default(),
                    c.get(2)
                        .map(|m| m.as_str().trim().to_string())
                        .unwrap_or_default(),
                    c.get(3)
                        .map(|m| m.as_str().trim().to_string())
                        .unwrap_or_default(),
                )
            })
            .unwrap_or_default()
    }

    fn story_status_from_sprint(
        sprint_status: &Option<SprintStatus>,
        epic_number: u32,
        story_number: u32,
        story_key: Option<&str>,
    ) -> StoryStatus {
        let epic_key = format!("epic-{}", epic_number);
        let story_number_key = format!("{}.{}", epic_number, story_number);

        sprint_status
            .as_ref()
            .and_then(|ss| ss.development_status.get(&epic_key))
            .and_then(|es| {
                if let Some(key) = story_key {
                    if let Some(status) = es.stories.get(key) {
                        return Some(status.clone());
                    }
                }

                for (key, status) in &es.stories {
                    if key.starts_with(&format!("{}-{}-", epic_number, story_number)) {
                        return Some(status.clone());
                    }
                }

                es.stories.get(&story_number_key).cloned()
            })
            .unwrap_or(StoryStatus::Backlog)
    }

    fn parse_stories_from_content(
        content: &str,
        epic_number: u32,
        sprint_status: &Option<SprintStatus>,
        source_time: &str,
    ) -> Vec<Story> {
        let mut stories = Vec::new();

        // Regex to match story headers like "### Story 1.1:" or "### Story 1.1: Title"
        let story_regex = Regex::new(r"(?m)^#{2,3}\s*Story\s*(\d+)\.(\d+)[:\s]*(.*)$").unwrap();

        for cap in story_regex.captures_iter(content) {
            let story_epic_num: u32 = cap.get(1).unwrap().as_str().parse().unwrap_or(0);
            let story_num: u32 = cap.get(2).unwrap().as_str().parse().unwrap_or(0);
            let story_title = cap.get(3).map(|m| m.as_str().trim()).unwrap_or("");

            if story_epic_num != epic_number {
                continue;
            }

            let story_number = format!("{}.{}", epic_number, story_num);
            let status =
                Self::story_status_from_sprint(sprint_status, epic_number, story_num, None);
            let (user_type, capability, value_benefit) =
                Self::extract_user_story_details(content);

            stories.push(Story {
                id: uuid::Uuid::new_v4().to_string(),
                epic_id: String::new(),
                number: story_number,
                title: if story_title.is_empty() {
                    format!("Story {}.{}", epic_number, story_num)
                } else {
                    story_title.to_string()
                },
                user_type,
                capability,
                value_benefit,
                acceptance_criteria: Vec::new(),
                status,
                tasks: Vec::new(),
                file_path: None,
                created_at: source_time.to_string(),
                updated_at: source_time.to_string(),
            });
        }

        stories
    }

    fn extract_title_from_markdown(content: &str) -> Option<String> {
        let title_regex = Regex::new(r"^#\s+(.+)$").unwrap();
        for line in content.lines() {
            if let Some(cap) = title_regex.captures(line.trim()) {
                return Some(cap.get(1).unwrap().as_str().trim().to_string());
            }
        }
        None
    }

    fn extract_section(content: &str, section_name: &str) -> Option<String> {
        let section_regex = Regex::new(&format!(r"(?i)\*\*{}\*\*[:\s]*(.+?)(?:\n\n|\*\*|\z)", section_name)).ok()?;

        section_regex
            .captures(content)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().trim().to_string())
            .or_else(|| {
                // Try markdown header format
                let header_regex = Regex::new(&format!(r"(?m)##\s*{}\s*\n([\s\S]*?)(?:\n##|\z)", section_name)).ok()?;
                header_regex
                    .captures(content)
                    .and_then(|c| c.get(1))
                    .map(|m| m.as_str().trim().to_string())
            })
    }

    /// Determine the current phase based on documents, epics, and sprint status
    fn determine_phase(documents: &[BmadDocument], epics: &[Epic], sprint_status: &Option<SprintStatus>) -> u8 {
        // Phase 4: Has epics in progress or done (active implementation)
        if let Some(ss) = sprint_status {
            for (_, epic_status) in &ss.development_status {
                if epic_status.status == EpicStatus::InProgress || epic_status.status == EpicStatus::Done {
                    return 4;
                }
            }
        }

        if epics.iter().any(|e| e.status == EpicStatus::InProgress || e.status == EpicStatus::Done) {
            return 4;
        }

        // Phase 3: Has architecture document
        if documents.iter().any(|d| d.doc_type == "architecture" || d.doc_type == "tech-spec") {
            return 3;
        }

        // Phase 2: Has PRD
        if documents.iter().any(|d| d.doc_type == "prd") {
            return 2;
        }

        // Phase 1: Analysis
        1
    }

    /// Scan a directory for BMAD projects
    pub fn scan_for_projects(root_path: &Path, max_depth: usize) -> Vec<PathBuf> {
        let mut projects = Vec::new();

        for entry in WalkDir::new(root_path)
            .max_depth(max_depth)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            if path.is_dir() && Self::is_bmad_project(path) {
                projects.push(path.to_path_buf());
            }
        }

        projects
    }
}
