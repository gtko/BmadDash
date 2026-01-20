// BMAD Project Types

export type BmadPhase = 1 | 2 | 3 | 4;

export type EpicStatus = "backlog" | "in-progress" | "done";

export type StoryStatus =
  | "backlog"
  | "ready-for-dev"
  | "in-progress"
  | "review"
  | "done";

export type RetrospectiveStatus = "optional" | "done";

export type DocumentType =
  | "prd"
  | "architecture"
  | "ux-design"
  | "epic"
  | "story"
  | "tech-spec"
  | "project-context";

// Acceptance Criteria in Given-When-Then format
export interface AcceptanceCriteria {
  given: string;
  when: string;
  then: string;
  additionalCriteria?: string[];
}

// User Story
export interface Story {
  id: string;
  epicId: string;
  number: string; // e.g., "1.1", "1.2"
  title: string;
  userType: string;
  capability: string;
  valueBenefit: string;
  acceptanceCriteria: AcceptanceCriteria[];
  status: StoryStatus;
  tasks?: Task[];
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

// Task within a Story
export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

// Epic
export interface Epic {
  id: string;
  number: number;
  title: string;
  goal: string;
  stories: Story[];
  status: EpicStatus;
  retrospective?: RetrospectiveStatus;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

// BMAD Document
export interface BmadDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  filePath: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// PRD specific structure
export interface PRDDocument extends BmadDocument {
  type: "prd";
  metadata: {
    author?: string;
    version?: string;
    functionalRequirements?: string[];
    nonFunctionalRequirements?: string[];
    stepsCompleted?: string[];
  };
}

// Architecture document
export interface ArchitectureDocument extends BmadDocument {
  type: "architecture";
  metadata: {
    techStack?: string[];
    patterns?: string[];
    diagrams?: string[];
  };
}

// Sprint Status (from sprint-status.yaml)
export interface SprintStatus {
  generated: string;
  project: string;
  projectKey: string;
  trackingSystem: string;
  storyLocation: string;
  developmentStatus: Record<string, EpicSprintStatus>;
}

export interface EpicSprintStatus {
  status: EpicStatus;
  stories: Record<string, StoryStatus>;
  retrospective?: RetrospectiveStatus;
}

// BMAD Project
export interface BmadProject {
  id: string;
  name: string;
  path: string;
  bmadDocsPath?: string;
  description?: string;
  currentPhase: BmadPhase;
  epics: Epic[];
  documents: BmadDocument[];
  sprintStatus?: SprintStatus;
  lastActivity: string;
  createdAt: string;
}

// Statistics for dashboard
export interface ProjectStats {
  totalEpics: number;
  completedEpics: number;
  totalStories: number;
  storiesByStatus: Record<StoryStatus, number>;
  progressPercentage: number;
  phaseProgress: Record<BmadPhase, boolean>;
}

// View types
export type ViewType = "dashboard" | "kanban" | "timeline" | "editor" | "progress";

// Filter options
export interface FilterOptions {
  epicIds?: string[];
  storyStatuses?: StoryStatus[];
  phases?: BmadPhase[];
  searchQuery?: string;
}
