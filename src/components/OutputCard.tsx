import { ReactNode } from "react";
import { Download, Copy, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadAsText, copyToClipboard, saveIdea } from "@/lib/localStorage";
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
    skipAnimation?: boolean;
  };
}

const OutputCard = ({ 
  title, 
  children, 
  content,
  className = "", 
  showActions = false,
  onSave,
  saveData,
}: OutputCardProps) => {
  const { toast } = useToast();
  const displayContent = content || (typeof children === 'string' ? children : '');
  const skipAnimation = saveData?.skipAnimation || false;
  const { displayedText, isComplete } = useTypingAnimation(displayContent, 15, skipAnimation);

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
      });
      toast({
        title: "Saved!",
        description: "Idea saved to your collection",
      });
      if (onSave) onSave();
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