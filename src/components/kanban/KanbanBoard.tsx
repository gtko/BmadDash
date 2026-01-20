import { useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import type { Story, StoryStatus, BmadProject } from "@/types";

const columns: { id: StoryStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-story-backlog" },
  { id: "ready-for-dev", title: "Ready", color: "bg-story-ready" },
  { id: "in-progress", title: "In Progress", color: "bg-story-progress" },
  { id: "review", title: "Review", color: "bg-story-review" },
  { id: "done", title: "Done", color: "bg-story-done" },
];

interface KanbanBoardProps {
  project: BmadProject;
}

export function KanbanBoard({ project }: KanbanBoardProps) {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const { updateStoryStatus } = useProjectStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Flatten all stories from all epics
  const allStories = useMemo(() => {
    return project.epics.flatMap((epic) =>
      epic.stories.map((story) => ({
        ...story,
        epicId: epic.id,
        epicNumber: epic.number,
        epicTitle: epic.title,
      }))
    );
  }, [project.epics]);

  // Group stories by status
  const storiesByStatus = useMemo(() => {
    const grouped: Record<StoryStatus, typeof allStories> = {
      backlog: [],
      "ready-for-dev": [],
      "in-progress": [],
      review: [],
      done: [],
    };

    allStories.forEach((story) => {
      grouped[story.status].push(story);
    });

    return grouped;
  }, [allStories]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const story = allStories.find((s) => s.id === active.id);
    if (story) {
      setActiveStory(story);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeStory = allStories.find((s) => s.id === active.id);

      if (activeStory) {
        // Check if dropped on a column
        const targetColumn = columns.find((col) => col.id === over.id);

        if (targetColumn) {
          updateStoryStatus(
            project.id,
            activeStory.epicId,
            activeStory.id,
            targetColumn.id
          );
        } else {
          // Check if dropped on another story
          const targetStory = allStories.find((s) => s.id === over.id);
          if (targetStory) {
            updateStoryStatus(
              project.id,
              activeStory.epicId,
              activeStory.id,
              targetStory.status
            );
          }
        }
      }
    }

    setActiveStory(null);
  };

  if (allStories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No stories in this project yet.</p>
          <p className="text-sm text-muted-foreground">
            Stories will appear here once they are created in your BMAD docs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
        <p className="text-sm text-muted-foreground">
          {allStories.length} stories across {project.epics.length} epics
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => (
              <SortableContext
                key={column.id}
                items={storiesByStatus[column.id].map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  count={storiesByStatus[column.id].length}
                >
                  {storiesByStatus[column.id].map((story) => (
                    <KanbanCard
                      key={story.id}
                      story={story}
                      epicNumber={story.epicNumber}
                      epicTitle={story.epicTitle}
                    />
                  ))}
                </KanbanColumn>
              </SortableContext>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeStory && (
            <KanbanCard
              story={activeStory}
              epicNumber={
                project.epics.find((e) => e.id === activeStory.epicId)?.number ||
                0
              }
              epicTitle={
                project.epics.find((e) => e.id === activeStory.epicId)?.title ||
                ""
              }
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
