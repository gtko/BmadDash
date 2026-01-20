import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMemo } from "react";
import type {
  BmadProject,
  Story,
  StoryStatus,
  EpicStatus,
  ViewType,
  FilterOptions,
  ProjectStats,
} from "@/types";

interface ProjectState {
  // Projects
  projects: BmadProject[];
  activeProjectId: string | null;

  // View state
  currentView: ViewType;
  sidebarOpen: boolean;

  // Filters
  filters: FilterOptions;

  // Actions - Projects
  addProject: (project: BmadProject) => void;
  removeProject: (projectId: string) => void;
  setActiveProject: (projectId: string | null) => void;
  updateProject: (projectId: string, updates: Partial<BmadProject>) => void;

  // Actions - Epics
  updateEpicStatus: (
    projectId: string,
    epicId: string,
    status: EpicStatus
  ) => void;

  // Actions - Stories
  updateStoryStatus: (
    projectId: string,
    epicId: string,
    storyId: string,
    status: StoryStatus
  ) => void;
  moveStory: (
    projectId: string,
    storyId: string,
    fromEpicId: string,
    toEpicId: string
  ) => void;

  // Actions - View
  setCurrentView: (view: ViewType) => void;
  toggleSidebar: () => void;

  // Actions - Filters
  setFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      // Initial state
      projects: [],
      activeProjectId: null,
      currentView: "dashboard",
      sidebarOpen: true,
      filters: {},

      // Project actions
      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),

      removeProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          activeProjectId:
            state.activeProjectId === projectId ? null : state.activeProjectId,
        })),

      setActiveProject: (projectId) =>
        set({ activeProjectId: projectId }),

      updateProject: (projectId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p
          ),
        })),

      // Epic actions
      updateEpicStatus: (projectId, epicId, status) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            return {
              ...project,
              epics: project.epics.map((epic) =>
                epic.id === epicId ? { ...epic, status } : epic
              ),
            };
          }),
        })),

      // Story actions
      updateStoryStatus: (projectId, epicId, storyId, status) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            return {
              ...project,
              epics: project.epics.map((epic) => {
                if (epic.id !== epicId) return epic;
                return {
                  ...epic,
                  stories: epic.stories.map((story) =>
                    story.id === storyId ? { ...story, status } : story
                  ),
                };
              }),
            };
          }),
        })),

      moveStory: (projectId, storyId, fromEpicId, toEpicId) =>
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;

            let movedStory: Story | null = null;

            const updatedEpics = project.epics.map((epic) => {
              if (epic.id === fromEpicId) {
                const story = epic.stories.find((s) => s.id === storyId);
                if (story) movedStory = { ...story, epicId: toEpicId };
                return {
                  ...epic,
                  stories: epic.stories.filter((s) => s.id !== storyId),
                };
              }
              if (epic.id === toEpicId && movedStory) {
                return {
                  ...epic,
                  stories: [...epic.stories, movedStory],
                };
              }
              return epic;
            });

            return { ...project, epics: updatedEpics };
          }),
        })),

      // View actions
      setCurrentView: (view) => set({ currentView: view }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Filter actions
      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
      clearFilters: () => set({ filters: {} }),
    }),
    {
      name: "bmad-dash-storage",
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);

// Selector hooks - use these instead of inline selectors
export function useActiveProject(): BmadProject | null {
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);

  return useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);
}

export function useProjectStats(projectId: string | null): ProjectStats | null {
  const projects = useProjectStore((state) => state.projects);

  return useMemo(() => {
    if (!projectId) return null;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;

    const totalEpics = project.epics.length;
    const completedEpics = project.epics.filter(
      (e) => e.status === "done"
    ).length;

    const allStories = project.epics.flatMap((e) => e.stories);
    const totalStories = allStories.length;

    const storiesByStatus: Record<StoryStatus, number> = {
      backlog: 0,
      "ready-for-dev": 0,
      "in-progress": 0,
      review: 0,
      done: 0,
    };

    allStories.forEach((story) => {
      storiesByStatus[story.status]++;
    });

    const completedStories = storiesByStatus.done;
    const progressPercentage =
      totalStories > 0
        ? Math.round((completedStories / totalStories) * 100)
        : 0;

    const phaseProgress: Record<1 | 2 | 3 | 4, boolean> = {
      1: project.documents.some((d) => d.type === "project-context"),
      2: project.documents.some((d) => d.type === "prd"),
      3: project.documents.some((d) => d.type === "architecture"),
      4: project.epics.length > 0,
    };

    return {
      totalEpics,
      completedEpics,
      totalStories,
      storiesByStatus,
      progressPercentage,
      phaseProgress,
    };
  }, [projects, projectId]);
}
