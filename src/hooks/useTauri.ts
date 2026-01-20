import { invoke } from "@tauri-apps/api/core";
import { open, ask, message } from "@tauri-apps/plugin-dialog";
import type { BmadProject } from "@/types";

export interface TauriAPI {
  scanProjects: (rootPath: string, maxDepth?: number) => Promise<string[]>;
  parseProject: (projectPath: string, bmadDocsPath?: string) => Promise<BmadProject>;
  isBmadProject: (path: string) => Promise<boolean>;
  findBmadDocsCandidates: (projectPath: string) => Promise<string[]>;
  readDocument: (filePath: string) => Promise<string>;
  writeDocument: (filePath: string, content: string) => Promise<void>;
  startProjectWatcher: (projectId: string, bmadDocsPath: string) => Promise<void>;
  stopProjectWatcher: (projectId: string) => Promise<void>;
  stopAllWatchers: () => Promise<void>;
  getHomeDirectory: () => Promise<string>;
  openFolderDialog: (title?: string) => Promise<string | null>;
  showMessage: (title: string, msg: string) => Promise<void>;
  askConfirm: (title: string, msg: string) => Promise<boolean>;
}

export function useTauri(): TauriAPI {
  const scanProjects = async (
    rootPath: string,
    maxDepth?: number
  ): Promise<string[]> => {
    return invoke("scan_projects", { rootPath, maxDepth });
  };

  const parseProject = async (
    projectPath: string,
    bmadDocsPath?: string
  ): Promise<BmadProject> => {
    return invoke("parse_project", { projectPath, bmadDocsPath });
  };

  const isBmadProject = async (path: string): Promise<boolean> => {
    return invoke("is_bmad_project", { path });
  };

  const findBmadDocsCandidates = async (projectPath: string): Promise<string[]> => {
    return invoke("find_bmad_docs_candidates", { projectPath });
  };

  const readDocument = async (filePath: string): Promise<string> => {
    return invoke("read_document", { filePath });
  };

  const writeDocument = async (
    filePath: string,
    content: string
  ): Promise<void> => {
    return invoke("write_document", { filePath, content });
  };

  const startProjectWatcher = async (
    projectId: string,
    bmadDocsPath: string
  ): Promise<void> => {
    return invoke("start_project_watch", { projectId, bmadDocsPath });
  };

  const stopProjectWatcher = async (projectId: string): Promise<void> => {
    return invoke("stop_project_watch", { projectId });
  };

  const stopAllWatchers = async (): Promise<void> => {
    return invoke("stop_all_watchers");
  };

  const getHomeDirectory = async (): Promise<string> => {
    return invoke("get_home_directory");
  };

  const openFolderDialog = async (title?: string): Promise<string | null> => {
    const result = await open({
      directory: true,
      multiple: false,
      title: title || "Select Folder",
    });
    return result as string | null;
  };

  const showMessage = async (title: string, msg: string): Promise<void> => {
    await message(msg, { title, kind: "info" });
  };

  const askConfirm = async (title: string, msg: string): Promise<boolean> => {
    return await ask(msg, { title, kind: "info" });
  };

  return {
    scanProjects,
    parseProject,
    isBmadProject,
    findBmadDocsCandidates,
    readDocument,
    writeDocument,
    startProjectWatcher,
    stopProjectWatcher,
    stopAllWatchers,
    getHomeDirectory,
    openFolderDialog,
    showMessage,
    askConfirm,
  };
}
