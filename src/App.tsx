import { useState, useCallback, useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { DocumentEditor } from "@/components/documents/DocumentEditor";
import { TimelineView } from "@/components/timeline/TimelineView";
import { SelectBmadDocsDialog } from "@/components/dialogs/SelectBmadDocsDialog";
import { useProjectStore, useActiveProject } from "@/stores/projectStore";
import { useTauri } from "@/hooks/useTauri";

interface FileChangePayload {
  projectId: string;
  path: string;
  kind: string;
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [pendingProjectPath, setPendingProjectPath] = useState<string | null>(null);
  const [bmadCandidates, setBmadCandidates] = useState<string[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);

  const currentView = useProjectStore((state) => state.currentView);
  const projects = useProjectStore((state) => state.projects);
  const addProject = useProjectStore((state) => state.addProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const activeProject = useActiveProject();
  const tauri = useTauri();
  const tauriRef = useRef(tauri);
  const projectsRef = useRef(projects);
  const refreshInFlight = useRef(new Set<string>());
  const watchedProjects = useRef(new Map<string, string>());
  const didInitialRefresh = useRef(false);

  useEffect(() => {
    tauriRef.current = tauri;
  }, [tauri]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const refreshProject = useCallback(
    async (projectId: string) => {
      const project = projectsRef.current.find((p) => p.id === projectId);
      if (!project || refreshInFlight.current.has(projectId)) {
        return;
      }

      refreshInFlight.current.add(projectId);
      setRefreshCount((count) => count + 1);
      try {
        const parsedProject = await tauriRef.current.parseProject(
          project.path,
          project.bmadDocsPath
        );
        const { id: _ignored, createdAt: _createdAt, ...updates } = parsedProject;
        updateProject(projectId, {
          ...updates,
          createdAt: project.createdAt,
          bmadDocsPath: parsedProject.bmadDocsPath || project.bmadDocsPath,
        });
      } catch (error) {
        console.error("Failed to refresh project:", error);
      } finally {
        refreshInFlight.current.delete(projectId);
        setRefreshCount((count) => Math.max(0, count - 1));
      }
    },
    [updateProject]
  );

  useEffect(() => {
    if (didInitialRefresh.current) return;
    if (projects.length === 0) {
      didInitialRefresh.current = true;
      return;
    }

    didInitialRefresh.current = true;

    const refreshAll = async () => {
      for (const project of projects) {
        await refreshProject(project.id);
      }
    };

    refreshAll();
  }, [projects, refreshProject]);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    const setup = async () => {
      unlisten = await listen<FileChangePayload>(
        "bmad-file-change",
        (event) => {
          refreshProject(event.payload.projectId);
        }
      );
    };

    setup();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [refreshProject]);

  useEffect(() => {
    const nextIds = new Set(projects.map((project) => project.id));
    const watched = watchedProjects.current;

    const syncWatchers = async () => {
      for (const project of projects) {
        const watchPath = project.bmadDocsPath || project.path;
        const existingPath = watched.get(project.id);
        if (existingPath === watchPath) continue;

        try {
          await tauriRef.current.startProjectWatcher(project.id, watchPath);
          watched.set(project.id, watchPath);
        } catch (error) {
          console.error("Failed to start watcher:", error);
        }
      }

      for (const watchedId of Array.from(watched.keys())) {
        if (nextIds.has(watchedId)) continue;
        try {
          await tauriRef.current.stopProjectWatcher(watchedId);
        } catch (error) {
          console.error("Failed to stop watcher:", error);
        } finally {
          watched.delete(watchedId);
        }
      }
    };

    syncWatchers();
  }, [projects]);

  useEffect(() => {
    return () => {
      tauriRef.current.stopAllWatchers().catch((error) => {
        console.error("Failed to stop watchers:", error);
      });
    };
  }, []);

  const completeProjectImport = useCallback(
    async (projectPath: string, bmadDocsPath?: string) => {
      try {
        const project = await tauri.parseProject(projectPath, bmadDocsPath);

        if (projects.some((p) => p.path === project.path)) {
          await tauri.showMessage("Already Added", "This project is already in your list.");
          return;
        }

        addProject(project);
        await tauri.showMessage("Success", `Project "${project.name}" added successfully!`);
      } catch (error) {
        console.error("Failed to parse project:", error);
        await tauri.showMessage("Error", `Failed to add project: ${error}`);
      }
    },
    [tauri, projects, addProject]
  );

  const handleAddProject = useCallback(async () => {
    try {
      // Step 1: Select project folder
      const projectPath = await tauri.openFolderDialog("Select Project Folder");
      if (!projectPath) return;

      setIsLoading(true);

      // Step 2: Search for bmad-docs candidates (including 1 level deep)
      const candidates = await tauri.findBmadDocsCandidates(projectPath);

      if (candidates.length === 1) {
        // Only one candidate found - use it directly
        await completeProjectImport(projectPath, candidates[0]);
      } else if (candidates.length > 1) {
        // Multiple candidates - let user choose
        setPendingProjectPath(projectPath);
        setBmadCandidates(candidates);
        setSelectDialogOpen(true);
      } else {
        // No candidates found - ask user to browse
        const wantToBrowse = await tauri.askConfirm(
          "BMAD Docs Not Found",
          "No bmad-docs folder was found automatically.\n\nWould you like to select it manually?"
        );

        if (wantToBrowse) {
          const bmadDocsPath = await tauri.openFolderDialog("Select BMAD Docs Folder");
          if (bmadDocsPath) {
            await completeProjectImport(projectPath, bmadDocsPath);
          }
        }
      }
    } catch (error) {
      console.error("Failed to add project:", error);
      await tauri.showMessage("Error", `Failed to add project: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [tauri, completeProjectImport]);

  const handleSelectBmadDocs = useCallback(
    async (bmadDocsPath: string) => {
      setSelectDialogOpen(false);
      if (pendingProjectPath) {
        setIsLoading(true);
        await completeProjectImport(pendingProjectPath, bmadDocsPath);
        setIsLoading(false);
        setPendingProjectPath(null);
        setBmadCandidates([]);
      }
    },
    [pendingProjectPath, completeProjectImport]
  );

  const handleBrowseBmadDocs = useCallback(async () => {
    setSelectDialogOpen(false);
    if (pendingProjectPath) {
      const bmadDocsPath = await tauri.openFolderDialog("Select BMAD Docs Folder");
      if (bmadDocsPath) {
        setIsLoading(true);
        await completeProjectImport(pendingProjectPath, bmadDocsPath);
        setIsLoading(false);
      }
      setPendingProjectPath(null);
      setBmadCandidates([]);
    }
  }, [pendingProjectPath, tauri, completeProjectImport]);

  const handleCancelSelect = useCallback(() => {
    setSelectDialogOpen(false);
    setPendingProjectPath(null);
    setBmadCandidates([]);
  }, []);

  const handleScanProjects = useCallback(async () => {
    try {
      const homeDir = await tauri.getHomeDirectory();
      setIsLoading(true);

      const projectPaths = await tauri.scanProjects(homeDir, 3);
      let addedCount = 0;

      for (const path of projectPaths) {
        if (projects.some((p) => p.path === path)) continue;

        try {
          const project = await tauri.parseProject(path);
          addProject(project);
          addedCount++;
        } catch (e) {
          console.warn(`Failed to parse project at ${path}:`, e);
        }
      }

      await tauri.showMessage(
        "Scan Complete",
        addedCount > 0
          ? `Found and added ${addedCount} new project(s).`
          : "No new BMAD projects found."
      );
    } catch (error) {
      console.error("Failed to scan projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tauri, projects, addProject]);

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            onAddProject={handleAddProject}
            onScanProjects={handleScanProjects}
            isLoading={isLoading}
          />
        );

      case "kanban":
        if (!activeProject) {
          return (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Select a project from the sidebar to view its Kanban board.
              </p>
            </div>
          );
        }
        return <KanbanBoard project={activeProject} />;

      case "editor":
        if (!activeProject) {
          return (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Select a project from the sidebar to view its documents.
              </p>
            </div>
          );
        }
        return <DocumentEditor project={activeProject} />;

      case "timeline":
        if (!activeProject) {
          return (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Select a project from the sidebar to view its timeline.
              </p>
            </div>
          );
        }
        return <TimelineView project={activeProject} />;

      case "progress":
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              Progress charts coming soon...
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar onAddProject={handleAddProject} />
      <main className="flex-1 overflow-hidden">{renderContent()}</main>

      <SelectBmadDocsDialog
        open={selectDialogOpen}
        onOpenChange={setSelectDialogOpen}
        candidates={bmadCandidates}
        projectPath={pendingProjectPath || ""}
        onSelect={handleSelectBmadDocs}
        onBrowse={handleBrowseBmadDocs}
        onCancel={handleCancelSelect}
      />

      {refreshCount > 0 && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Mise a jour des projets...
              </p>
              <p className="text-xs text-muted-foreground">
                Synchronisation en cours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
