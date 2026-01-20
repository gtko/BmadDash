import { useState, useEffect } from "react";
import {
  FileText,
  FileCode,
  FileCog,
  FileCheck,
  Pencil,
  Eye,
  Save,
  X,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import MDEditor from "@uiw/react-md-editor";
import type { BmadProject, BmadDocument, DocumentType } from "@/types";
import { useTauri } from "@/hooks/useTauri";

interface DocumentEditorProps {
  project: BmadProject;
}

type DocTypeKey = DocumentType | "other";

const docTypeIcons: Record<DocTypeKey, React.ComponentType<{ className?: string }>> = {
  prd: FileText,
  architecture: FileCode,
  "tech-spec": FileCog,
  "ux-design": FileCheck,
  "project-context": FolderOpen,
  epic: FileText,
  story: FileText,
  other: FileText,
};

const docTypeLabels: Record<DocTypeKey, string> = {
  prd: "PRD",
  architecture: "Architecture",
  "tech-spec": "Tech Spec",
  "ux-design": "UX Design",
  "project-context": "Project Context",
  epic: "Epic",
  story: "Story",
  other: "Document",
};

const docTypeColors: Record<DocTypeKey, string> = {
  prd: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  architecture: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "tech-spec": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "ux-design": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "project-context": "bg-green-500/20 text-green-400 border-green-500/30",
  epic: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  story: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function getDocType(doc: BmadDocument): DocTypeKey {
  return (doc.type as DocTypeKey) || "other";
}

export function DocumentEditor({ project }: DocumentEditorProps) {
  const [selectedDoc, setSelectedDoc] = useState<BmadDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const tauri = useTauri();

  // Group documents by type
  const groupedDocs = project.documents.reduce((acc, doc) => {
    const type = getDocType(doc);
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, BmadDocument[]>);

  // Sort types by importance
  const sortedTypes = ["prd", "architecture", "tech-spec", "ux-design", "project-context", "epic", "story", "other"].filter(
    (type) => groupedDocs[type]?.length > 0
  );

  useEffect(() => {
    if (!project.documents.length) {
      setSelectedDoc(null);
      return;
    }

    if (isEditing && hasChanges) {
      return;
    }

    if (!selectedDoc) {
      setSelectedDoc(project.documents[0]);
      return;
    }

    const updatedDoc = project.documents.find(
      (doc) => doc.filePath === selectedDoc.filePath
    );
    setSelectedDoc(updatedDoc || project.documents[0]);
  }, [project.documents, selectedDoc, isEditing, hasChanges]);

  const handleEdit = () => {
    if (selectedDoc) {
      setEditContent(selectedDoc.content);
      setIsEditing(true);
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent("");
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!selectedDoc || !hasChanges) return;

    setIsSaving(true);
    try {
      await tauri.writeDocument(selectedDoc.filePath, editContent);
      // Update local state
      selectedDoc.content = editContent;
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save document:", error);
      await tauri.showMessage("Error", `Failed to save document: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (value: string | undefined) => {
    const newContent = value || "";
    setEditContent(newContent);
    setHasChanges(newContent !== selectedDoc?.content);
  };

  if (project.documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-medium text-foreground">No documents found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This project doesn't have any BMAD documents yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Document List Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Documents</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {project.documents.length} document{project.documents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {sortedTypes.map((type) => (
              <div key={type}>
                <div className="px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {docTypeLabels[type as DocTypeKey] || type}
                  </span>
                </div>
                <div className="space-y-1">
                  {groupedDocs[type].map((doc) => {
                    const docType = getDocType(doc);
                    const Icon = docTypeIcons[docType] || FileText;
                    const isSelected = selectedDoc?.id === doc.id;

                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          if (isEditing && hasChanges) {
                            // Prompt to save
                            return;
                          }
                          setSelectedDoc(doc);
                          setIsEditing(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm truncate flex-1">{doc.title}</span>
                        {isSelected && (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Document Viewer/Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedDoc ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                <Badge
                  variant="outline"
                  className={cn("shrink-0", docTypeColors[getDocType(selectedDoc)])}
                >
                  {docTypeLabels[getDocType(selectedDoc)]}
                </Badge>
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {selectedDoc.title}
                </h2>
                {hasChanges && (
                  <Badge variant="secondary" className="shrink-0">
                    Unsaved
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleEdit}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-background" data-color-mode="dark">
              {isEditing ? (
                <MDEditor
                  value={editContent}
                  onChange={handleContentChange}
                  height="100%"
                  preview="edit"
                  className="!h-full !bg-background"
                  textareaProps={{
                    placeholder: "Write your document content here...",
                  }}
                />
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-6 max-w-4xl mx-auto">
                    <article className="prose prose-invert prose-sm sm:prose-base max-w-none
                      prose-headings:text-foreground prose-headings:font-semibold
                      prose-p:text-muted-foreground prose-p:leading-relaxed
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-foreground
                      prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-muted prose-pre:border prose-pre:border-border
                      prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:not-italic
                      prose-table:text-sm
                      prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-medium prose-th:text-foreground prose-th:border prose-th:border-border
                      prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-border prose-td:text-muted-foreground
                      prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:marker:text-muted-foreground
                      [&_table]:w-full [&_table]:overflow-x-auto [&_table]:block [&_table]:max-w-fit
                    ">
                      <MDEditor.Markdown
                        source={selectedDoc.content}
                      />
                    </article>
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground truncate">
                {selectedDoc.filePath}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Eye className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">Select a document to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
