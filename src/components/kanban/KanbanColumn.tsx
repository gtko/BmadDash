import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StoryStatus } from "@/types";

interface KanbanColumnProps {
  id: StoryStatus;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({
  id,
  title,
  color,
  count,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 bg-card/50 rounded-lg border border-border",
        isOver && "border-primary ring-2 ring-primary/20"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className={cn("w-2 h-2 rounded-full", color)} />
        <span className="font-medium text-foreground">{title}</span>
        <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 p-2">
        <div className="flex flex-col gap-2">{children}</div>
      </ScrollArea>
    </div>
  );
}
