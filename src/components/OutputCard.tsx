import { ReactNode, useState } from "react";
import { Download, Copy, Save, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadAsText, copyToClipboard, saveIdea, generateTeamRoles, TeamRole } from "@/lib/localStorage";
import { useTypingAnimation } from "@/hooks/useTypingAnimation";

interface OutputCardProps {
  title?: string | ReactNode;
  children?: ReactNode;
  content?: string;
  className?: string;
  showActions?: boolean;
  onSave?: () => void;
  saveData?: {
    theme: string;
    type: 'idea' | 'expansion' | 'pitch' | 'qa';
  };
  teamRoles?: TeamRole[];
  onTeamRolesChange?: (roles: TeamRole[]) => void;
}

const OutputCard = ({ 
  title, 
  children, 
  content,
  className = "", 
  showActions = false,
  onSave,
  saveData,
  teamRoles,
  onTeamRolesChange,
}: OutputCardProps) => {
  const { toast } = useToast();
  const displayContent = content || (typeof children === 'string' ? children : '');
  const { displayedText, isComplete } = useTypingAnimation(displayContent, 15);
  const [localTeamRoles, setLocalTeamRoles] = useState<TeamRole[]>(teamRoles || []);

  const handleDownload = () => {
    const filename = `hackmate-${saveData?.type || 'content'}-${Date.now()}.txt`;
    downloadAsText(displayContent, filename);
    toast({
      title: "Downloaded!",
      description: "Your content has been saved as a text file",
    });
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(displayContent);
    if (success) {
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } else {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    if (saveData) {
      saveIdea({
        ...saveData,
        content: displayContent,
        teamRoles: localTeamRoles.length > 0 ? localTeamRoles : undefined,
      });
      toast({
        title: "Saved!",
        description: "Idea saved to your collection",
      });
      if (onSave) onSave();
    }
  };

  const handleShuffleTeam = () => {
    const newRoles = generateTeamRoles();
    setLocalTeamRoles(newRoles);
    if (onTeamRolesChange) {
      onTeamRolesChange(newRoles);
    }
  };

  return (
    <div className={`bg-card rounded-xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-[box-shadow] duration-300 border border-border ${className}`}>
      {title && (
        <div className="mb-3">
          {typeof title === 'string' ? (
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      
      <div className="text-foreground whitespace-pre-wrap mb-4">
        {displayedText || children}
        {!isComplete && displayContent && (
          <span className="inline-block w-1 h-5 bg-primary ml-1 animate-pulse" />
        )}
      </div>

      {localTeamRoles.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-foreground">Suggested Team Roles</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShuffleTeam}
              className="h-8"
            >
              <Shuffle className="h-3 w-3 mr-1" />
              Shuffle
            </Button>
          </div>
          <div className="space-y-2">
            {localTeamRoles.map((role, index) => (
              <div key={index} className="text-sm text-foreground">
                <span className="font-medium">{role.role}:</span> {role.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {showActions && isComplete && (
        <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-9"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-9"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {saveData && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="h-9"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Idea
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default OutputCard;