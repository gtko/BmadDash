import { useState } from "react";
import { FolderOpen, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SelectBmadDocsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: string[];
  projectPath: string;
  onSelect: (path: string) => void;
  onBrowse: () => void;
  onCancel: () => void;
}

export function SelectBmadDocsDialog({
  open,
  onOpenChange,
  candidates,
  projectPath,
  onSelect,
  onBrowse,
  onCancel,
}: SelectBmadDocsDialogProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(
    candidates.length > 0 ? candidates[0] : null
  );

  const handleConfirm = () => {
    if (selectedPath) {
      onSelect(selectedPath);
    }
  };

  // Get relative path for display
  const getRelativePath = (fullPath: string) => {
    if (fullPath.startsWith(projectPath)) {
      return fullPath.slice(projectPath.length + 1) || fullPath;
    }
    return fullPath;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select BMAD Documentation Folder</DialogTitle>
          <DialogDescription>
            {candidates.length > 0
              ? "We found potential BMAD documentation folders. Please select one:"
              : "No BMAD folders found automatically. Please browse to select one."}
          </DialogDescription>
        </DialogHeader>

        {candidates.length > 0 && (
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="flex flex-col gap-2">
              {candidates.map((path) => (
                <button
                  key={path}
                  onClick={() => setSelectedPath(path)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    selectedPath === path
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <FolderOpen
                    className={cn(
                      "h-5 w-5 shrink-0",
                      selectedPath === path
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {getRelativePath(path)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {path}
                    </p>
                  </div>
                  {selectedPath === path && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onBrowse} className="w-full sm:w-auto">
            Browse manually...
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="ghost" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            {candidates.length > 0 && (
              <Button
                onClick={handleConfirm}
                disabled={!selectedPath}
                className="flex-1"
              >
                Use selected
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
