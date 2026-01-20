import {
  FolderOpen,
  MoreVertical,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectStats } from "@/stores/projectStore";
import type { BmadProject, BmadPhase, StoryStatus } from "@/types";

interface ProjectCardProps {
  project: BmadProject;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}

const defaultStoriesByStatus: Record<StoryStatus, number> = {
  backlog: 0,
  "ready-for-dev": 0,
  "in-progress": 0,
  review: 0,
  done: 0,
};

const phaseLabels: Record<BmadPhase, string> = {
  1: "Analysis",
  2: "Planning",
  3: "Solutioning",
  4: "Implementation",
};

const phaseColors: Record<BmadPhase, string> = {
  1: "bg-phase-1",
  2: "bg-phase-2",
  3: "bg-phase-3",
  4: "bg-phase-4",
};

export function ProjectCard({
  project,
  isActive,
  onClick,
  onRemove,
}: ProjectCardProps) {
  const stats = useProjectStats(project.id);
  const storiesByStatus = stats?.storiesByStatus || defaultStoriesByStatus;
  const totalStories = stats?.totalStories || 0;
  const progressPercentage = stats?.progressPercentage || 0;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 overflow-hidden",
        isActive && "border-primary shadow-lg shadow-primary/10"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "p-2 rounded-lg shrink-0",
              phaseColors[project.currentPhase as BmadPhase],
              "bg-opacity-20"
            )}
          >
            <FolderOpen
              className={cn(
                "h-5 w-5",
                `text-phase-${project.currentPhase}`
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {project.path}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                // Open in finder/explorer
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Finder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phase indicator */}
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              `bg-phase-${project.currentPhase}/20 text-phase-${project.currentPhase} border-phase-${project.currentPhase}/30`
            )}
          >
            Phase {project.currentPhase}: {phaseLabels[project.currentPhase as BmadPhase]}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Stats */}
        {totalStories > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            <StatItem
              icon={Circle}
              label="Backlog"
              value={(storiesByStatus["backlog"] || 0) + (storiesByStatus["ready-for-dev"] || 0)}
              color="text-story-backlog"
            />
            <StatItem
              icon={Clock}
              label="In Progress"
              value={(storiesByStatus["in-progress"] || 0) + (storiesByStatus["review"] || 0)}
              color="text-story-progress"
            />
            <StatItem
              icon={CheckCircle2}
              label="Done"
              value={storiesByStatus["done"] || 0}
              color="text-story-done"
            />
          </div>
        )}

        {/* Epics summary */}
        {stats && stats.totalEpics > 0 && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Epics</span>
            <span>
              <span className="text-story-done font-medium">
                {stats.completedEpics}
              </span>
              <span className="text-muted-foreground">
                /{stats.totalEpics}
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}

function StatItem({ icon: Icon, label, value, color }: StatItemProps) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        <Icon className={cn("h-3 w-3", color)} />
        <span className={cn("font-semibold", color)}>{value}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
