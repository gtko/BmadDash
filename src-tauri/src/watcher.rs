use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use parking_lot::Mutex;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

/// Debounce duration for file change events
const DEBOUNCE_DURATION: Duration = Duration::from_millis(500);

/// File watcher state
pub struct FileWatcherState {
    watchers: HashMap<String, RecommendedWatcher>,
    last_events: HashMap<String, Instant>,
}

impl Default for FileWatcherState {
    fn default() -> Self {
        Self {
            watchers: HashMap::new(),
            last_events: HashMap::new(),
        }
    }
}

/// Payload for file change events
#[derive(Clone, serde::Serialize)]
pub struct FileChangePayload {
    pub project_id: String,
    pub path: String,
    pub kind: String,
}

/// Start watching a project's bmad-docs folder
pub fn start_watching(
    app: AppHandle,
    state: Arc<Mutex<FileWatcherState>>,
    project_id: String,
    bmad_docs_path: PathBuf,
) -> Result<(), String> {
    let mut state_guard = state.lock();

    // Stop existing watcher for this project if any
    state_guard.watchers.remove(&project_id);

    let project_id_clone = project_id.clone();
    let app_clone = app.clone();
    let state_clone = state.clone();

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, notify::Error>| {
            match res {
                Ok(event) => {
                    // Filter for relevant events
                    let dominated = matches!(
                        event.kind,
                        notify::EventKind::Create(_)
                            | notify::EventKind::Modify(_)
                            | notify::EventKind::Remove(_)
                    );

                    if !dominated {
                        return;
                    }

                    // Check for markdown or yaml files
                    let relevant_paths: Vec<_> = event
                        .paths
                        .iter()
                        .filter(|p| {
                            if let Some(ext) = p.extension() {
                                let ext_str = ext.to_string_lossy().to_lowercase();
                                ext_str == "md" || ext_str == "yaml" || ext_str == "yml"
                            } else {
                                false
                            }
                        })
                        .collect();

                    if relevant_paths.is_empty() {
                        return;
                    }

                    // Debounce: check if we recently sent an event for this project
                    {
                        let mut state_guard = state_clone.lock();
                        let now = Instant::now();
                        if let Some(last) = state_guard.last_events.get(&project_id_clone) {
                            if now.duration_since(*last) < DEBOUNCE_DURATION {
                                return;
                            }
                        }
                        state_guard.last_events.insert(project_id_clone.clone(), now);
                    }

                    // Emit event to frontend
                    let kind = match event.kind {
                        notify::EventKind::Create(_) => "create",
                        notify::EventKind::Modify(_) => "modify",
                        notify::EventKind::Remove(_) => "remove",
                        _ => "unknown",
                    };

                    let path_str = relevant_paths
                        .first()
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_default();

                    let payload = FileChangePayload {
                        project_id: project_id_clone.clone(),
                        path: path_str,
                        kind: kind.to_string(),
                    };

                    let _ = app_clone.emit("bmad-file-change", payload);
                }
                Err(e) => {
                    eprintln!("Watch error: {:?}", e);
                }
            }
        },
        Config::default().with_poll_interval(Duration::from_secs(2)),
    )
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(&bmad_docs_path, RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch path: {}", e))?;

    state_guard.watchers.insert(project_id, watcher);

    Ok(())
}

/// Stop watching a project
pub fn stop_watching(state: Arc<Mutex<FileWatcherState>>, project_id: &str) {
    let mut state_guard = state.lock();
    state_guard.watchers.remove(project_id);
    state_guard.last_events.remove(project_id);
}

/// Stop all watchers
pub fn stop_all(state: Arc<Mutex<FileWatcherState>>) {
    let mut state_guard = state.lock();
    state_guard.watchers.clear();
    state_guard.last_events.clear();
}
