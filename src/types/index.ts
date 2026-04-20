export interface Grade {
  id: string;
  code: string;
  name: string;
  total_chapters: number;
  total_modules: number;
  total_assets: number;
}

export interface Chapter {
  id: string;
  grade_id: string;
  grade_code: string;
  code: string;
  name_en: string;
  name_id: string;
  description_en: string;
  description_id: string;
  learning_objectives_en: string;
  learning_objectives_id: string;
}

export interface Module {
  id: string;
  chapter_id: string;
  grade_code: string;
  chapter_code: string;
  code: string;
  mid: string;
  name_en: string;
  name_id: string;
  description_en: string;
  description_id: string;
  learning_objectives_en: string;
  learning_objectives_id: string;
  owner: string;
  phase: string;
  tranche: string;
  content_closure_status: string;
}

export type AssetType = 'Slide' | 'Video' | 'Snapshot Applet' | 'InWorld Applet' | 'Learning Applet' | 'Practice Applet';

export interface Asset {
  id: string;
  module_id: string;
  grade_code: string;
  chapter_code: string;
  chapter_name: string;
  module_name: string;
  module_mid: string;
  mid: string;
  asset_type: AssetType | string;
  allocated_to: string;
  module_owner: string;
  upload_status_en: string;
  upload_status_id: string;
  ready_for_review: string;
  qc_teacher_portal: string;
  qc_ifp: string;
  final_status: string;
  merdeka_final: boolean;
  cultural_fit: string;
  link_en: string;
  link_id: string;
  link_en_status: string;
  link_id_status: string;
  drop_date: string;
  thumbnail: string;
  asset_tag_en: string;
  asset_tag_id: string;
  comments: string;
  phase: string;
}

export interface SyncLog {
  id: string;
  synced_at: string;
  rows_processed: number;
  rows_added: number;
  rows_updated: number;
  status: 'success' | 'error';
  error_message?: string;
}

// Curriculum Tracker types
export interface CurriculumModule {
  phase: string;
  tpCode: string;
  thread: string;
  strand: string;
  gradeCode: string;
  chapterCode: string;
  chapterName: string;
  conceptCode: string;
  conceptName: string;
  conceptType: string;
  conceptDescription: string;
  status: string;
  teamOwner: string;
  individualOwner: string;
  dateOfDelivery: string;
}

export interface CurriculumStats {
  total: number;
  completed: number;
  contentReady: number;
  wip: number;
  yetToStart: number;
  closedPct: number;
  progressPct: number;
}

export interface DashboardStats {
  total_assets: number;
  total_modules: number;
  total_chapters: number;
  total_grades: number;
  completion_rate: number;
  uploaded_count: number;
  pending_qc: number;
  qc_completed: number;
  assets_by_type: { name: string; value: number; color: string }[];
  assets_by_grade: { grade: string; total: number; completed: number; pending: number }[];
  assets_by_phase: { phase: string; total: number; completed: number }[];
  assets_by_vendor: { vendor: string; total: number; completed: number; pending: number }[];
  qc_pipeline: { stage: string; count: number; color: string }[];
  last_sync?: string;
}
