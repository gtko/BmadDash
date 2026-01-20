import { useState } from "react";
import {
  Plus,
  FolderSearch,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/projectStore";
import { ProjectCard } from "./ProjectCard";
import { EmptyState } from "./EmptyState";

interface DashboardProps {
  onAddProject: () => void;
  onScanProjects: () => void;
  isLoading: boolean;
}

export function Dashboard({
  onAddProject,
  onScanProjects,
  isLoading,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { projects, activeProjectId, setActiveProject, removeProject } =
    useProjectStore();

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (projects.length === 0) {
    return (
      <EmptyState onAddProject={onAddProject} onScanProjects={onScanProjects} />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onScanProjects} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Scan
          </Button>
          <Button size="sm" onClick={onAddProject}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <div className="relative flex-1 max-w-sm">
          <FolderSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 border border-border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No projects match your search.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                onClick={() => setActiveProject(project.id)}
                onRemove={() => removeProject(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                onClick={() => setActiveProject(project.id)}
                onRemove={() => removeProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
