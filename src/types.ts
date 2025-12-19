export interface GitProfile {
  name: string;
  email: string;
  sshKey?: string;
  signingKey?: string;
}

export interface FolderProfile {
  path: string;
  profile: string;
}

export interface GitXConfig {
  profiles: Record<string, GitProfile>;
  folderProfiles: FolderProfile[];
  defaultProfile?: string;
}

export interface DoctorCheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  fix?: () => Promise<void>;
}
