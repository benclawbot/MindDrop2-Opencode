
export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum ColumnId {
  Todo = 'todo',
  InProgress = 'in-progress',
  Done = 'done'
}

export type AIActionType = 'content' | 'code' | 'image' | 'none';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  aiAction?: AIActionType;
  content?: string; 
  estimation?: number; // In minutes
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  size: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string; 
}

export interface Comment {
  id: string;
  text: string;
  createdAt: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64 or Data URL
}

export interface MeetingMinute {
  id: string;
  rawContent: string;
  structuredHTML: string;
  extractedTasks: Array<{ title: string, deadline?: string, priority: Priority }>;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  columnId: ColumnId;
  subtasks: Subtask[];
  images: GeneratedImage[];
  comments: Comment[];
  attachments: Attachment[];
  tags: string[];
  deadline?: number;
  createdAt: number;
  isPendingAnalysis?: boolean;
  estimation?: number; // Total initial estimation in minutes
  remainingTime?: number; // Current remaining time in minutes
  duration?: number;
  reminderSent?: boolean;
}

export interface Column {
  id: ColumnId;
  title: string;
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';
