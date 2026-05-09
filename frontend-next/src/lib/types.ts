// Shared TypeScript types
export interface PlayerStats {
  Kills: number;
  Deaths: number;
  CC: number;
  Dealt: number;
  Taken: number;
  Healed: number;
  Class?: string;
  Spec?: string;
  Enemy?: boolean;
}

export interface PlayerRow extends PlayerStats {
  name: string;
  selectedClass: string;
  selectedSpec: string;
}

export interface ScoreboardRecord {
  id: number;
  user_id: string;
  timestamp: string;
  data: PlayerRow[];
  expanded?: boolean;
}

export type SortKey = 'name' | 'selectedClass' | 'selectedSpec' | 'Kills' | 'Deaths' | 'CC' | 'Dealt' | 'Taken' | 'Healed';
