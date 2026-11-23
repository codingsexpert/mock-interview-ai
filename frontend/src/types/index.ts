export type ExperienceLevel = "entry" | "mid" | "senior" | "lead";

export interface TopicFocus {
  topic: string;
  focus_area: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface ResumeParsedData {
  candidate_name: string;
  total_experience_years: number;
  key_strengths: string[];
  technical_gaps: string[];
  suggested_topics: TopicFocus[];
  interview_strategy: string;
}

export interface StartInterviewResponse {
  success: boolean;
  session_id: string;
  turn_number: number;
  question_text: string;
  audio_url?: string;
  error?: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  session_id: string;
  turn_number: number;
  is_completed: boolean;
  next_question?: string;
  audio_url?: string;
  error?: string;
}

export interface CategoryScores {
  technical_depth: number;
  communication_clarity: number;
  problem_solving: number;
  experience_alignment: number;
}

export interface QuestionBreakdownItem {
  turn_number: number;
  question: string;
  candidate_answer: string;
  critique: string;
  model_answer_points: string[];
}

export interface InterviewReport {
  session_id: string;
  overall_score: number;
  hiring_verdict: string;
  executive_summary: string;
  category_scores: CategoryScores;
  strengths: string[];
  areas_for_improvement: string[];
  question_breakdown: QuestionBreakdownItem[];
}
