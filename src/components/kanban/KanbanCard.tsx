import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Story } from "@/types";

interface KanbanCardProps {
  story: Story;
  epicNumber: number;
  epicTitle: string;
  isDragging?: boolean;
}

export function KanbanCard({
  story,
  epicNumber,
  epicTitle: _epicTitle,
  isDragging,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: story.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        "bg-card hover:bg-card/80 border-border",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg rotate-2"
      )}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="p-3 pb-1">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className="text-xs bg-epic/10 text-epic border-epic/30"
          >
            Epic {epicNumber}
          </Badge>
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="space-y-2">
          <div>
            <span className="text-xs text-muted-foreground">
              Story {story.number}
            </span>
            <h4 className="font-medium text-sm text-foreground line-clamp-2">
              {story.title}
            </h4>
          </div>

          {story.userType && story.capability && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              As a <span className="text-foreground/80">{story.userType}</span>,
              I want to{" "}
              <span className="text-foreground/80">{story.capability}</span>
            </p>
          )}

          {story.tasks && story.tasks.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {story.tasks.filter((t) => t.completed).length}/{story.tasks.length} tasks
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
