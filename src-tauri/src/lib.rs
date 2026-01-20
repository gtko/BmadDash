mod commands;
mod models;
mod parser;
mod watcher;

use commands::*;
use parking_lot::Mutex;
use std::sync::Arc;
use watcher::FileWatcherState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let watcher_state = Arc::new(Mutex::new(FileWatcherState::default()));

    tauri::Builder::default()
        .manage(watcher_state)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_projects,
            parse_project,
            is_bmad_project,
            find_bmad_docs_candidates,
            get_project_stats,
            read_document,
            write_document,
            start_project_watch,
            stop_project_watch,
            stop_all_watchers,
            get_home_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
