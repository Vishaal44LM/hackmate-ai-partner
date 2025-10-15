export interface SavedIdea {
  id: string;
  theme: string;
  content: string;
  type: 'idea' | 'expansion' | 'pitch' | 'qa';
  timestamp: number;
}

const STORAGE_KEY = 'hackmate_saved_ideas';

export const saveIdea = (idea: Omit<SavedIdea, 'id' | 'timestamp'>): SavedIdea => {
  const savedIdea: SavedIdea = {
    ...idea,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  const existing = getSavedIdeas();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([savedIdea, ...existing]));
  return savedIdea;
};

export const getSavedIdeas = (): SavedIdea[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const deleteIdea = (id: string): void => {
  const existing = getSavedIdeas();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter(i => i.id !== id)));
};

export const exportProjectData = (projectTheme: string, ideas: SavedIdea[]): void => {
  const projectIdeas = ideas.filter(i => i.theme === projectTheme);
  
  let content = `HACKMATE PROJECT EXPORT\n`;
  content += `========================\n\n`;
  content += `Project: ${projectTheme}\n`;
  content += `Exported: ${new Date().toLocaleString()}\n\n`;
  content += `========================\n\n`;
  
  const ideaContent = projectIdeas.find(i => i.type === 'idea');
  const expansionContent = projectIdeas.find(i => i.type === 'expansion');
  const pitchContent = projectIdeas.find(i => i.type === 'pitch');
  const qaContent = projectIdeas.find(i => i.type === 'qa');
  
  if (ideaContent) {
    content += `PROJECT IDEA\n`;
    content += `============\n\n`;
    content += `${ideaContent.content}\n\n`;
    content += `========================\n\n`;
  }
  
  if (expansionContent) {
    content += `EXPANDED PLAN\n`;
    content += `=============\n\n`;
    content += `${expansionContent.content}\n\n`;
    content += `========================\n\n`;
  }
  
  if (pitchContent) {
    content += `PITCH SCRIPT\n`;
    content += `============\n\n`;
    content += `${pitchContent.content}\n\n`;
    content += `========================\n\n`;
  }
  
  if (qaContent) {
    content += `JUDGE Q&A PRACTICE\n`;
    content += `==================\n\n`;
    content += `${qaContent.content}\n\n`;
    content += `========================\n\n`;
  }
  
  const filename = `hackmate-${projectTheme.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.txt`;
  downloadAsText(content, filename);
};

export const downloadAsText = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};
