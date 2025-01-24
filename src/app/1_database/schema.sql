-- Knowledge Base Tables
create table zen_skills (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  category text not null,
  level text not null check (level in ('beginner', 'intermediate', 'expert')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table zen_learning_paths (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  skill_id uuid references zen_skills(id),
  order_index integer not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table zen_learning_materials (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  type text not null check (type in ('article', 'video', 'exercise', 'assessment')),
  path_id uuid references zen_learning_paths(id),
  order_index integer not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table zen_user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  material_id uuid references zen_learning_materials(id),
  status text not null check (status in ('not_started', 'in_progress', 'completed')),
  score integer,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, material_id)
);

create table zen_user_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  skill_id uuid references zen_skills(id),
  level text not null check (level in ('beginner', 'intermediate', 'expert')),
  certified boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, skill_id)
);

create table zen_assessments (
  id uuid default gen_random_uuid() primary key,
  skill_id uuid references zen_skills(id),
  title text not null,
  description text,
  passing_score integer not null,
  level text not null check (level in ('beginner', 'intermediate', 'expert')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table zen_assessment_questions (
  id uuid default gen_random_uuid() primary key,
  assessment_id uuid references zen_assessments(id),
  question text not null,
  answer_type text not null check (answer_type in ('multiple_choice', 'text', 'code')),
  correct_answer text not null,
  points integer not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table zen_user_assessment_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  assessment_id uuid references zen_assessments(id),
  score integer not null,
  passed boolean not null,
  answers jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Initial data for AI and Prompt Engineering skills
insert into zen_skills (name, description, category, level) values
('Prompt Engineering Basics', 'Understanding the fundamentals of writing effective prompts for AI models', 'Prompt Engineering', 'beginner'),
('Advanced Prompt Patterns', 'Advanced techniques for complex prompt engineering scenarios', 'Prompt Engineering', 'intermediate'),
('AI Agent Architecture', 'Designing and implementing AI agent systems', 'AI Development', 'intermediate'),
('LLM Integration', 'Working with Large Language Models in applications', 'AI Development', 'intermediate'),
('AI System Optimization', 'Optimizing AI systems for performance and efficiency', 'AI Development', 'expert');

-- Create indexes for better query performance
create index idx_user_progress_user_id on zen_user_progress(user_id);
create index idx_user_skills_user_id on zen_user_skills(user_id);
create index idx_learning_materials_path_id on zen_learning_materials(path_id);
create index idx_assessment_questions_assessment_id on zen_assessment_questions(assessment_id); 