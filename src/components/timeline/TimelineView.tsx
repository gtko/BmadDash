import { useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Flag,
} from "lucide-react";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { BmadProject, BmadPhase, EpicStatus, StoryStatus } from "@/types";

interface TimelineViewProps {
  project: BmadProject;
}

const phaseLabels: Record<BmadPhase, string> = {
  1: "Analysis",
  2: "Planning",
  3: "Solutioning",
  4: "Implementation",
};

const epicStatusStyles: Record<
  EpicStatus,
  { label: string; badge: string; dot: string }
> = {
  backlog: {
    label: "Backlog",
    badge: "bg-story-backlog/20 text-story-backlog border-story-backlog/30",
    dot: "bg-story-backlog",
  },
  "in-progress": {
    label: "In Progress",
    badge: "bg-story-progress/20 text-story-progress border-story-progress/30",
    dot: "bg-story-progress",
  },
  done: {
    label: "Done",
    badge: "bg-story-done/20 text-story-done border-story-done/30",
    dot: "bg-story-done",
  },
};

const storyStatusStyles: Record<
  StoryStatus,
  { label: string; badge: string; dot: string }
> = {
  backlog: {
    label: "Backlog",
    badge: "bg-story-backlog/20 text-story-backlog border-story-backlog/30",
    dot: "bg-story-backlog",
  },
  "ready-for-dev": {
    label: "Ready",
    badge: "bg-story-ready/20 text-story-ready border-story-ready/30",
    dot: "bg-story-ready",
  },
  "in-progress": {
    label: "In Progress",
    badge: "bg-story-progress/20 text-story-progress border-story-progress/30",
    dot: "bg-story-progress",
  },
  review: {
    label: "Review",
    badge: "bg-story-review/20 text-story-review border-story-review/30",
    dot: "bg-story-review",
  },
  done: {
    label: "Done",
    badge: "bg-story-done/20 text-story-done border-story-done/30",
    dot: "bg-story-done",
  },
};

function formatDate(value: string) {
  const date = new Date(value);
  if (!isValid(date)) return "Unknown";
  return format(date, "MMM d, yyyy");
}

function formatAgo(value: string) {
  const date = new Date(value);
  if (!isValid(date)) return "Unknown";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function TimelineView({ project }: TimelineViewProps) {
  const sortedEpics = useMemo(() => {
    return [...project.epics].sort((a, b) => a.number - b.number);
  }, [project.epics]);

  const storyTotals = useMemo(() => {
    const totals: Record<StoryStatus, number> = {
      backlog: 0,
      "ready-for-dev": 0,
      "in-progress": 0,
      review: 0,
      done: 0,
    };

    project.epics.forEach((epic) => {
      epic.stories.forEach((story) => {
        totals[story.status]++;
      });
    });

    return totals;
  }, [project.epics]);

  const totalStories =
    storyTotals.backlog +
    storyTotals["ready-for-dev"] +
    storyTotals["in-progress"] +
    storyTotals.review +
    storyTotals.done;

  const inProgressStories =
    storyTotals["in-progress"] + storyTotals.review;

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Timeline</h1>
            <p className="text-sm text-muted-foreground">
              Milestones and story flow for {project.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                `bg-phase-${project.currentPhase}/20 text-phase-${project.currentPhase} border-phase-${project.currentPhase}/30`
              )}
            >
              Phase {project.currentPhase}:{" "}
              {phaseLabels[project.currentPhase as BmadPhase]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Updated {formatAgo(project.lastActivity)}
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={Flag}
            label="Epics"
            value={project.epics.length}
            accent="text-epic"
          />
          <StatTile
            icon={Calendar}
            label="Total Stories"
            value={totalStories}
            accent="text-story-ready"
          />
          <StatTile
            icon={Clock3}
            label="In Progress"
            value={inProgressStories}
            accent="text-story-progress"
          />
          <StatTile
            icon={CheckCircle2}
            label="Done"
            value={storyTotals.done}
            accent="text-story-done"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {sortedEpics.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Flag className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">No epics yet.</p>
              <p className="text-sm text-muted-foreground">
                Your timeline will appear once epics are added to the BMAD docs.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-6">
              {sortedEpics.map((epic) => {
                const statusStyle = epicStatusStyles[epic.status];
                const storyCounts = epic.stories.reduce(
                  (acc, story) => {
                    acc.total += 1;
                    acc[story.status] += 1;
                    return acc;
                  },
                  {
                    total: 0,
                    backlog: 0,
                    "ready-for-dev": 0,
                    "in-progress": 0,
                    review: 0,
                    done: 0,
                  } as Record<StoryStatus | "total", number>
                );

                const progress =
                  storyCounts.total > 0
                    ? Math.round((storyCounts.done / storyCounts.total) * 100)
                    : 0;

                const sortedStories = [...epic.stories].sort((a, b) =>
                  a.number.localeCompare(b.number, undefined, { numeric: true })
                );
                const previewStories = sortedStories.slice(0, 4);
                const remainingStories = sortedStories.length - previewStories.length;

                return (
                  <div key={epic.id} className="relative pl-10">
                    <span
                      className={cn(
                        "absolute left-2 top-6 h-4 w-4 rounded-full border-2 border-background",
                        statusStyle.dot
                      )}
                    />
                    <Card className="py-4">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                              Epic {epic.number}
                            </p>
                            <h3 className="text-lg font-semibold text-foreground">
                              {epic.title}
                            </h3>
                            {epic.goal && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {epic.goal}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-start gap-2 md:items-end">
                            <Badge
                              variant="outline"
                              className={cn("text-xs", statusStyle.badge)}
                            >
                              {statusStyle.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Updated {formatDate(epic.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{storyCounts.total} stories</span>
                          <span>•</span>
                          <span>{storyCounts.done} done</span>
                          <span>•</span>
                          <span>
                            {storyCounts["in-progress"] + storyCounts.review} in
                            progress
                          </span>
                          <span>•</span>
                          <span>
                            {storyCounts.backlog + storyCounts["ready-for-dev"]}{" "}
                            backlog
                          </span>
                        </div>
                        <Progress value={progress} className="h-1" />

                        {previewStories.length > 0 && (
                          <div className="grid gap-2">
                            {previewStories.map((story) => {
                              const storyStyle = storyStatusStyles[story.status];
                              return (
                                <div
                                  key={story.number}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={cn(
                                        "h-2 w-2 rounded-full",
                                        storyStyle.dot
                                      )}
                                    />
                                    <span className="text-xs font-medium text-foreground">
                                      {story.number}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate">
                                      {story.title}
                                    </span>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className={cn("text-xs", storyStyle.badge)}
                                  >
                                    {storyStyle.label}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {remainingStories > 0 && (
                          <p className="text-xs text-muted-foreground">
                            + {remainingStories} more stor
                            {remainingStories === 1 ? "y" : "ies"}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatTileProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}

function StatTile({ icon: Icon, label, value, accent }: StatTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/70 px-4 py-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg bg-muted/60",
          accent
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-lg font-semibold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
