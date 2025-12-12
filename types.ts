export interface Language {
  code: string;
  name: string;
}

export type ViewMode = 'original' | 'translated' | 'split';

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  QUEUED = 'QUEUED', // New status for batch processing
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface BubbleCoordinates {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface Bubble {
  coordinates: BubbleCoordinates;
  translatedText: string;
}

export interface PageData {
  id: string;
  originalImage: string;
  bubbles: Bubble[] | null;
  status: AppStatus;
}