use crate::models::*;
use crate::parser::BmadParser;
use crate::watcher::{self, FileWatcherState};
use parking_lot::Mutex;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, State};

#[tauri::command]
pub fn scan_projects(root_path: String, max_depth: Option<usize>) -> Result<Vec<String>, String> {
    let path = Path::new(&root_path);
    if !path.exists() {
        return Err(format!("Path does not exist: {}", root_path));
    }

    let depth = max_depth.unwrap_or(3);
    let projects = BmadParser::scan_for_projects(path, depth);

    Ok(projects
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect())
}

#[tauri::command]
pub fn parse_project(project_path: String, bmad_docs_path: Option<String>) -> Result<BmadProject, String> {
    let path = Path::new(&project_path);
    if !path.exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    let bmad_dir = bmad_docs_path.map(|p| std::path::PathBuf::from(p));
    BmadParser::parse_project(path, bmad_dir.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_bmad_project(path: String) -> bool {
    BmadParser::is_bmad_project(Path::new(&path))
}

/// Search for potential bmad-docs directories (1 level deep)
#[tauri::command]
pub fn find_bmad_docs_candidates(project_path: String) -> Vec<String> {
    let path = Path::new(&project_path);
    let mut candidates = Vec::new();

    // Check root level first
    let bmad_docs = path.join("bmad-docs");
    if bmad_docs.exists() && bmad_docs.is_dir() {
        candidates.push(bmad_docs.to_string_lossy().to_string());
    }

    let dot_bmad = path.join(".bmad");
    if dot_bmad.exists() && dot_bmad.is_dir() {
        candidates.push(dot_bmad.to_string_lossy().to_string());
    }

    // Search 1 level deep
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.filter_map(|e| e.ok()) {
            let entry_path = entry.path();
            if entry_path.is_dir() {
                // Check for bmad-docs inside subdirectory
                let sub_bmad_docs = entry_path.join("bmad-docs");
                if sub_bmad_docs.exists() && sub_bmad_docs.is_dir() {
                    candidates.push(sub_bmad_docs.to_string_lossy().to_string());
                }

                let sub_dot_bmad = entry_path.join(".bmad");
                if sub_dot_bmad.exists() && sub_dot_bmad.is_dir() {
                    candidates.push(sub_dot_bmad.to_string_lossy().to_string());
                }

                // Also check if the subdirectory itself looks like a bmad-docs folder
                let dir_name = entry_path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if dir_name == "bmad-docs" || dir_name == ".bmad" || dir_name.contains("bmad") {
                    // Verify it contains typical BMAD files
                    if entry_path.join("prd.md").exists()
                        || entry_path.join("epics").exists()
                        || entry_path.join("sprint-status.yaml").exists()
                        || entry_path.join("architecture.md").exists() {
                        if !candidates.contains(&entry_path.to_string_lossy().to_string()) {
                            candidates.push(entry_path.to_string_lossy().to_string());
                        }
                    }
                }
            }
        }
    }

    candidates
}

#[tauri::command]
pub fn get_project_stats(project: BmadProject) -> ProjectStats {
    let total_epics = project.epics.len();
    let completed_epics = project.epics.iter().filter(|e| e.status == EpicStatus::Done).count();

    let all_stories: Vec<&Story> = project.epics.iter().flat_map(|e| &e.stories).collect();
    let total_stories = all_stories.len();

    let mut stories_by_status: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    stories_by_status.insert("backlog".to_string(), 0);
    stories_by_status.insert("ready-for-dev".to_string(), 0);
    stories_by_status.insert("in-progress".to_string(), 0);
    stories_by_status.insert("review".to_string(), 0);
    stories_by_status.insert("done".to_string(), 0);

    for story in &all_stories {
        let status_key = match story.status {
            StoryStatus::Backlog => "backlog",
            StoryStatus::ReadyForDev => "ready-for-dev",
            StoryStatus::InProgress => "in-progress",
            StoryStatus::Review => "review",
            StoryStatus::Done => "done",
        };
        *stories_by_status.get_mut(status_key).unwrap() += 1;
    }

    let completed_stories = *stories_by_status.get("done").unwrap_or(&0);
    let progress_percentage = if total_stories > 0 {
        ((completed_stories as f64 / total_stories as f64) * 100.0) as u8
    } else {
        0
    };

    ProjectStats {
        total_epics,
        completed_epics,
        total_stories,
        stories_by_status,
        progress_percentage,
    }
}

#[tauri::command]
pub fn read_document(file_path: String) -> Result<String, String> {
    std::fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_document(file_path: String, content: String) -> Result<(), String> {
    std::fs::write(&file_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_project_watch(
    app: AppHandle,
    state: State<Arc<Mutex<FileWatcherState>>>,
    project_id: String,
    bmad_docs_path: String,
) -> Result<(), String> {
    watcher::start_watching(
        app,
        state.inner().clone(),
        project_id,
        PathBuf::from(bmad_docs_path),
    )
}

#[tauri::command]
pub fn stop_project_watch(
    state: State<Arc<Mutex<FileWatcherState>>>,
    project_id: String,
) {
    watcher::stop_watching(state.inner().clone(), &project_id);
}

#[tauri::command]
pub fn stop_all_watchers(state: State<Arc<Mutex<FileWatcherState>>>) {
    watcher::stop_all(state.inner().clone());
}

#[tauri::command]
pub fn get_home_directory() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not find home directory".to_string())
}
