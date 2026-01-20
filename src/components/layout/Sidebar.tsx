import {
  LayoutDashboard,
  KanbanSquare,
  FileText,
  Calendar,
  BarChart3,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProjectStore, useProjectStats } from "@/stores/projectStore";
import type { ViewType, BmadProject } from "@/types";

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "kanban", label: "Kanban", icon: KanbanSquare },
  { id: "editor", label: "Documents", icon: FileText },
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "progress", label: "Progress", icon: BarChart3 },
];

interface SidebarProps {
  onAddProject: () => void;
}

export function Sidebar({ onAddProject }: SidebarProps) {
  const {
    projects,
    activeProjectId,
    currentView,
    sidebarOpen,
    setActiveProject,
    setCurrentView,
    toggleSidebar,
  } = useProjectStore();

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <span className="font-semibold text-sidebar-foreground">
              BmadDash
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            const button = (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "justify-start gap-3 h-10",
                  sidebarOpen ? "w-full px-3" : "w-10 px-0 justify-center",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => setCurrentView(item.id)}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Button>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </div>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Projects */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2">
            {sidebarOpen && (
              <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
                Projects
              </span>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={onAddProject}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Add Project</TooltipContent>
            </Tooltip>
          </div>

          <ScrollArea className="h-full px-2">
            <div className="flex flex-col gap-1 pb-4">
              {projects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isActive={project.id === activeProjectId}
                  collapsed={!sidebarOpen}
                  onClick={() => setActiveProject(project.id)}
                />
              ))}
              {projects.length === 0 && sidebarOpen && (
                <div className="px-3 py-8 text-center text-sm text-sidebar-foreground/50">
                  No projects yet.
                  <br />
                  Click + to add one.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "justify-start gap-3 h-10",
                  sidebarOpen ? "w-full px-3" : "w-10 px-0 justify-center",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>Settings</span>}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right">Settings</TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

interface ProjectItemProps {
  project: BmadProject;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function ProjectItem({
  project,
  isActive,
  collapsed,
  onClick,
}: ProjectItemProps) {
  const stats = useProjectStats(project.id);

  const button = (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "justify-start gap-3 h-auto py-2",
        collapsed ? "w-10 px-0 justify-center" : "w-full px-3",
        isActive
          ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      onClick={onClick}
    >
      <FolderOpen className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium truncate">{project.name}</div>
          {stats && (
            <div className="text-xs text-sidebar-foreground/60">
              Phase {project.currentPhase} • {stats.progressPercentage}%
            </div>
          )}
        </div>
      )}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          <div>
            <div className="font-medium">{project.name}</div>
            {stats && (
              <div className="text-xs text-muted-foreground">
                Phase {project.currentPhase} • {stats.progressPercentage}%
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
