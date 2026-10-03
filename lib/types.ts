export type MediaKind = "image" | "video" | "document";
export type MediaStatus = "uploading" | "processing" | "ready" | "review" | "error" | "archived";
export type MediaSource = "demo" | "upload" | "drive-import";

export type MediaAsset = {
  id: string;
  name: string;
  kind: MediaKind;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  orientation: "vertical" | "horizontal" | "square" | "unknown";
  folderId: string;
  folderPath: string;
  driveId?: string;
  sourceDriveId?: string;
  localPath?: string;
  framePaths?: string[];
  previewUrl: string;
  descriptionShort: string;
  descriptionFull: string;
  tags: string[];
  colors: string[];
  products: string[];
  contexts: string[];
  suggestedUse: string[];
  confidence: number;
  status: MediaStatus;
  statusNote?: string;
  source: MediaSource;
  createdAt: string;
  updatedAt: string;
  uploadedBy: string;
  aiModel?: string;
  analyzedAt?: string;
};

export type HubFolder = {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  driveId?: string;
  protected?: boolean;
  createdAt: string;
};

export type Job = {
  id: string;
  kind: "analyze" | "import-source";
  targetId: string;
  payload: Record<string, unknown>;
  status: "queued" | "running" | "done" | "error";
  progress: number;
  message?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditEvent = {
  id: number;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail?: string;
};

export type ConnectionStatus = {
  destination: boolean;
  source: boolean;
  openrouter: boolean;
  destinationRootId?: string;
  model: string;
};

export type SourceDefinition = {
  id: string;
  name: string;
  folderId: string;
  url: string;
  readOnly: true;
};

export type BootstrapData = {
  media: MediaAsset[];
  folders: HubFolder[];
  jobs: Job[];
  audit: AuditEvent[];
  connections: ConnectionStatus;
  sources: SourceDefinition[];
  user: { name: string; role: "admin" | "manager" | "viewer" };
  demoMode: boolean;
};
