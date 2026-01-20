use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum EpicStatus {
    Backlog,
    InProgress,
    Done,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum StoryStatus {
    Backlog,
    ReadyForDev,
    InProgress,
    Review,
    Done,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum RetrospectiveStatus {
    Optional,
    Done,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AcceptanceCriteria {
    pub given: String,
    pub when: String,
    pub then: String,
    #[serde(default)]
    pub additional_criteria: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub title: String,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Story {
    pub id: String,
    pub epic_id: String,
    pub number: String,
    pub title: String,
    pub user_type: String,
    pub capability: String,
    pub value_benefit: String,
    #[serde(default)]
    pub acceptance_criteria: Vec<AcceptanceCriteria>,
    pub status: StoryStatus,
    #[serde(default)]
    pub tasks: Vec<Task>,
    pub file_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Epic {
    pub id: String,
    pub number: u32,
    pub title: String,
    pub goal: String,
    #[serde(default)]
    pub stories: Vec<Story>,
    pub status: EpicStatus,
    pub retrospective: Option<RetrospectiveStatus>,
    pub file_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BmadDocument {
    pub id: String,
    #[serde(rename = "type")]
    pub doc_type: String,
    pub title: String,
    pub content: String,
    pub file_path: String,
    #[serde(default)]
    pub metadata: serde_json::Value,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EpicSprintStatus {
    pub status: EpicStatus,
    #[serde(default)]
    pub stories: std::collections::HashMap<String, StoryStatus>,
    pub retrospective: Option<RetrospectiveStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SprintStatus {
    pub generated: String,
    pub project: String,
    pub project_key: String,
    pub tracking_system: String,
    pub story_location: String,
    #[serde(default)]
    pub development_status: std::collections::HashMap<String, EpicSprintStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BmadProject {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(default)]
    pub bmad_docs_path: String,
    pub description: Option<String>,
    pub current_phase: u8,
    #[serde(default)]
    pub epics: Vec<Epic>,
    #[serde(default)]
    pub documents: Vec<BmadDocument>,
    pub sprint_status: Option<SprintStatus>,
    pub last_activity: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectStats {
    pub total_epics: usize,
    pub completed_epics: usize,
    pub total_stories: usize,
    pub stories_by_status: std::collections::HashMap<String, usize>,
    pub progress_percentage: u8,
}
