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

export interface StatMap {
  Kills: number;
  Deaths: number;
  CC: number;
  Dealt: number;
  Taken: number;
  Healed: number;
}

export interface ProfileMatch {
  id: number;
  timestamp: string;
  uploaded_by: string;
  won: boolean | null;
  player_stats: PlayerRow;
  all_players: PlayerRow[];
}

export interface PlayerProfile {
  name: string;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number | null;
  main_class: string;
  main_spec: string;
  totals: StatMap;
  averages: StatMap;
  last_3_matches: ProfileMatch[];
}
