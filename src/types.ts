export interface RenderMediaRequest {
  renderId: string;
  compositionId: string;
  inputProps?: Record<string, unknown>;
  outputLocation: string;
}

export enum RenderStatus {
  QUEUED = 'queued',
  COMPLETED = 'completed',
};
