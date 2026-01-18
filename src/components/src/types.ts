export type Language = 'en' | 'ru';

export type MilestoneType = 'small' | 'big' | 'custom';
export type CoupleMode = 'SOLO' | 'TOGETHER';
export type EventType = 'anniversary' | 'vacation' | 'holiday' | 'custom';
export type MemoryContentType = 'photo' | 'audio' | 'video' | 'text';

export interface Milestone {
  day: number;
  title: string;
  description: string;
  type: MilestoneType;
  date?: string;
  eventType?: EventType;
}

export interface CustomEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  reminderDays?: number[];
  isRecurring?: boolean;
}

export interface Reaction {
  emoji: string;
  authorId: string;
  timestamp: string;
}

export interface Memory {
  id: string;
  date: string;
  dayCount: number;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  content?: string;
  contentType?: MemoryContentType;
  note?: string;
  noteA?: string;
  noteB?: string;
  authorA?: string;
  authorB?: string;
  milestoneReached?: boolean;
  isPrivate?: boolean;
  lockedUntil?: string;
  reactions?: Reaction[];
}

export type StoryFilter = 'all' | 'photos' | 'notes' | 'milestones';

export interface UserSettings {
  startDate: string | null;
  language: Language;
  customEvents: CustomEvent[];
  coupleMode: CoupleMode;
  inviteCode: string | null;
  partnerName?: string;
  isConnected: boolean;
}

export enum Tab {
  HOME = 'HOME',
  TIMELINE = 'TIMELINE',
  SETTINGS = 'SETTINGS',
  CALENDAR = 'CALENDAR'
}

