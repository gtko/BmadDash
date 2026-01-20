import { FolderPlus, FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddProject: () => void;
  onScanProjects: () => void;
}

export function EmptyState({ onAddProject, onScanProjects }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <FolderPlus className="w-12 h-12 text-primary" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-phase-4/20 flex items-center justify-center">
          <span className="text-lg font-bold text-phase-4">B</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2">
        Welcome to BmadDash
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Track your BMAD projects, manage epics and stories, and monitor progress
        all in one place.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" onClick={onAddProject}>
          <FolderPlus className="h-5 w-5 mr-2" />
          Add Project
        </Button>
        <Button variant="outline" size="lg" onClick={onScanProjects}>
          <FolderSearch className="h-5 w-5 mr-2" />
          Scan for Projects
        </Button>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        <FeatureCard
          phase={1}
          title="Track Progress"
          description="Monitor epics and stories across all 4 BMAD phases"
        />
        <FeatureCard
          phase={2}
          title="Manage Documents"
          description="View and edit PRDs, Architecture docs, and more"
        />
        <FeatureCard
          phase={3}
          title="Visualize"
          description="Kanban boards, timelines, and progress charts"
        />
      </div>
    </div>
  );
}

interface FeatureCardProps {
  phase: 1 | 2 | 3;
  title: string;
  description: string;
}

function FeatureCard({ phase, title, description }: FeatureCardProps) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card/50 text-center">
      <div
        className={`w-8 h-8 rounded-full mx-auto mb-3 flex items-center justify-center bg-phase-${phase}/20`}
      >
        <span className={`text-sm font-bold text-phase-${phase}`}>{phase}</span>
      </div>
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
