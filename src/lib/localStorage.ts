export interface SavedIdea {
  id: string;
  theme: string;
  content: string;
  type: 'idea' | 'expansion' | 'pitch' | 'qa';
  timestamp: number;
  teamRoles?: TeamRole[];
}

export interface TeamRole {
  role: string;
  name: string;
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

export const generateTeamRoles = (): TeamRole[] => {
  const roles = [
    'Frontend Developer',
    'Backend Developer',
    'AI/ML Engineer',
    'UI/UX Designer',
    'Product Manager',
    'DevOps Engineer',
  ];
  
  const names = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank',
    'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo',
  ];
  
  const selectedRoles = roles.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 2));
  const shuffledNames = [...names].sort(() => Math.random() - 0.5);
  
  return selectedRoles.map((role, index) => ({
    role,
    name: shuffledNames[index],
  }));
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
