import { useState, useEffect } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSavedIdeas, deleteIdea, SavedIdea } from "@/lib/localStorage";
import OutputCard from "@/components/OutputCard";
import { useToast } from "@/hooks/use-toast";

const MyIdeas = () => {
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setSavedIdeas(getSavedIdeas());
  }, []);

  const handleDelete = (id: string) => {
    deleteIdea(id);
    setSavedIdeas(getSavedIdeas());
    toast({
      title: "Idea deleted",
      description: "Your saved idea has been removed",
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      idea: "Project Idea",
      expansion: "Expanded Plan",
      pitch: "Pitch Script",
      qa: "Judge Q&A",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-subtle)]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Saved Ideas
            </h1>
            <p className="text-lg text-muted-foreground">
              Revisit and manage your saved hackathon projects
            </p>
          </div>

          {savedIdeas.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 shadow-[var(--shadow-card)] text-center">
              <Save className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2 text-foreground">No saved ideas yet</h2>
              <p className="text-muted-foreground">
                Start generating ideas and save them to revisit later!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedIdeas.map((idea) => (
                <OutputCard
                  key={idea.id}
                  title={
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm text-primary font-medium">
                          {getTypeLabel(idea.type)}
                        </span>
                        <div className="text-xs text-muted-foreground mt-1">
                          Theme: {idea.theme} • {new Date(idea.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(idea.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  }
                  content={idea.content}
                  showActions={true}
                  teamRoles={idea.teamRoles}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyIdeas;
