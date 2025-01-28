// Generated from schema.json - DO NOT EDIT MANUALLY
export interface ZenProject {
  id: string;
  name: string;
  description: string | null;
  admin_id: string;
  client_count: number;
  employee_count: number;
  active_tickets: number;
  created_at: string;
}

export interface ZenUser {
  id: string;
  email: string;
  name: string;
  role: string;
  last_login: string | null;
  created_at: string;
}

export interface ZenClient {
  user_id: string;
  company: string;
  plan: string;
  active_tickets: number;
  total_tickets: number;
}

export interface ZenEmployee {
  user_id: string;
  department: string;
  specialties: string[];
  performance: Record<string, any>;
  active_tickets: number;
}

export interface ZenTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: Record<string, any>;
  project_id: string;
  created_by: string;
  assigned_to: string | null;
  client: string;
  tags: string[];
  searchable_text: string | null;
  has_feedback: boolean | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  resolved_at: string | null;
  email_thread_id: string | null;
  last_email_sync_at: string | null;
}

export interface ZenActivity {
  id: string;
  type: string;
  user_id: string;
  project_id: string;
  description: string;
  created_at: string;
}

export interface ZenAgent {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  is_active: boolean | null;
}

export interface ZenAdmin {
  user_id: string;
  managed_departments: string[];
  permissions: string[];
}

export interface ZenProjectAdmin {
  user_id: string;
  permissions: string[];
  projects: string[];
}

export interface ZenTeam {
  id: string;
  name: string;
  description: string | null;
  focus_area: string;
  team_lead_id: string;
  created_at: string;
  updated_at: string;
}

export interface ZenTeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: string;
  joined_at: string;
}

export interface ZenTeamSkill {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

export interface ZenTeamMemberSkill {
  id: string;
  team_member_id: string;
  skill_id: string;
}

export interface ZenSkill {
  id: string;
  name: string;
  description: string | null;
  category: string;
  level: string;
  created_at: string;
  updated_at: string;
}

export interface ZenUserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  level: string;
  certified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ZenTicketMessage {
  id: string;
  ticket_id: string;
  content: string;
  created_by: string | null;
  source: string;
  metadata: Record<string, any> | null;
  has_been_read: boolean;
  created_at: string;
}

export interface ZenTicketComment {
  id: string;
  ticket_id: string;
  content: string;
  created_by: string;
  is_internal: boolean;
  type: string | null;
  attachments: string[];
  created_at: string;
}

export interface ZenTicketAttachment {
  id: string;
  ticket_id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface ZenTicketActivity {
  id: string;
  ticket_id: string | null;
  activity_type: string;
  content: string | null;
  created_by: string | null;
  media_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ZenTicketSummary {
  id: string;
  ticket_id: string | null;
  summary: string;
  created_by: string | null;
  created_by_role: string;
  recordings: Record<string, any>[];
  created_at: string;
}

export interface ZenTimeEntry {
  id: string;
  ticket_id: string;
  user_id: string;
  category: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  description: string | null;
  billable: boolean;
  created_at: string;
  updated_at: string;
}

export interface ZenKnowledgeArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  status: string;
  tags: string[];
  related_articles: string[];
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ZenArticleCategory {
  id: string;
  name: string;
  description: string | null;
  article_count: number;
  parent_id: string | null;
}

export interface ZenArticleFeedback {
  id: string;
  article_id: string;
  user_id: string;
  is_helpful: boolean;
  comment: string | null;
  created_at: string;
}

export interface ZenEmailTemplate {
  id: string;
  name: string;
  subject_template: string;
  body_template: string;
  created_at: string;
  updated_at: string;
}

export interface ZenEmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
  template_id: string | null;
  metadata: Record<string, any> | null;
  error_message: string | null;
  sent_at: string;
}

export interface ZenEmailReply {
  id: string;
  from_email: string;
  subject: string;
  body: string;
  ticket_id: string | null;
  original_email_id: string | null;
  processing_status: string;
  metadata: Record<string, any> | null;
  ai_analysis: Record<string, any> | null;
  received_at: string;
  processed_at: string | null;
}

export interface ZenCourse {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  modules: Record<string, any>[];
  progress: number | null;
  created_at: string;
  updated_at: string;
}

export interface ZenLearningPath {
  id: string;
  name: string;
  description: string | null;
  skill_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ZenLearningMaterial {
  id: string;
  title: string;
  content: string;
  type: string;
  order_index: number;
  path_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZenUserProgress {
  id: string;
  user_id: string;
  material_id: string;
  status: string;
  score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZenAssessment {
  id: string;
  title: string;
  description: string | null;
  skill_id: string | null;
  passing_score: number;
  level: string;
  created_at: string;
  updated_at: string;
}

export interface ZenAssessmentQuestion {
  id: string;
  assessment_id: string | null;
  question: string;
  answer_type: string;
  correct_answer: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface ZenUserAssessmentResult {
  id: string;
  user_id: string | null;
  assessment_id: string | null;
  score: number;
  passed: boolean;
  answers: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ZenPerformanceGoal {
  id: string;
  user_id: string;
  metric: string;
  target: number;
  progress: number;
  unit: string | null;
  timeframe: string;
  trend_value: number | null;
  trend_direction: string | null;
  start_date: string;
  end_date: string | null;
}

export interface ZenNote {
  id: string;
  project_id: string | null;
  content: string;
  created_by: string | null;
  mentions: string[];
  created_at: string;
  updated_at: string;
}

export interface ZenSharedTemplate {
  id: string;
  template_id: string;
  shared_by: string;
  shared_with: string[];
  approval_status: string;
  approval_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  effectiveness_usage_count: number | null;
  effectiveness_success_rate: number | null;
  effectiveness_avg_response_time: number | null;
}

export interface ZenTemplateVersion {
  id: string;
  template_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface ZenUserTimezone {
  id: string;
  user_id: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface ZenWorkingHours {
  id: string;
  user_id: string;
  project_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface ZenShift {
  id: string;
  user_id: string;
  project_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface ZenPendingInvite {
  id: string;
  email: string;
  role: string;
  project_id: string;
  invited_by: string | null;
  status: string;
  invited_at: string;
}
