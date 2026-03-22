export interface ReworkEntry {
  data: string;
  sha: string;
  autor: string;
  total_changes: number;
  rework_changes_total: number;
  rework_rate_total: number;
  rework_changes_recent: number;
  rework_rate_recent: number;
  arquivos_modificados: string[];
}

export interface ReworkData {
  threshold: number;
  data: ReworkEntry[];
}

export interface ChurnWeek {
  week_start: string;
  week_end: string;
  churn_lines: number;
  commits: number;
}

export interface ChurnFile {
  file: string;
  churn_lines: number;
  modifications: number;
}

export interface ChurnAuthor {
  author: string;
  churn_lines: number;
  commits: number;
}

export interface ChurnData {
  repo: string;
  generated_at: string;
  churn_summary: {
    total_churn_lines: number;
    total_commits: number;
    average_churn_per_commit: number;
  };
  weekly_churn: ChurnWeek[];
  top_files_by_churn: ChurnFile[];
  top_authors_by_churn: ChurnAuthor[];
}

export interface RefactorEntry {
  data: string;
  sha: string;
  autor: string;
  total_lines: number;
  refactor_lines: number;
  refactor_detected: boolean;
  arquivos_refatorados: string[];
}

export interface RefactorData {
  data: RefactorEntry[];
}
