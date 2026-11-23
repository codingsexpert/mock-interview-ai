-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase auth.users)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text not null,
    email text unique not null,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Resumes Table
create table if not exists public.resumes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    file_name text not null,
    file_path text not null,
    file_size_bytes bigint,
    raw_text text,
    parsed_skills text[] default '{}'::text[],
    parsed_experience jsonb default '[]'::jsonb,
    summary text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Interview Sessions Table
create table if not exists public.interview_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    resume_id uuid references public.resumes(id) on delete cascade not null,
    job_title text not null,
    job_description text,
    experience_level text not null check (experience_level in ('entry', 'mid', 'senior', 'lead')),
    status text default 'pending' not null check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
    overall_score numeric(5, 2),
    feedback_report jsonb,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Interview Turns Table
create table if not exists public.interview_turns (
    id uuid default gen_random_uuid() primary key,
    session_id uuid references public.interview_sessions(id) on delete cascade not null,
    turn_number integer not null,
    interviewer_question text not null,
    interviewer_audio_url text,
    candidate_audio_url text,
    candidate_transcript text,
    feedback_notes text,
    turn_score numeric(5, 2),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (session_id, turn_number)
);

-- Indexes for performance
create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_interview_sessions_user_id on public.interview_sessions(user_id);
create index if not exists idx_interview_sessions_status on public.interview_sessions(status);
create index if not exists idx_interview_turns_session_id on public.interview_turns(session_id);

-- Updated_at timestamp trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Apply triggers
create trigger set_profiles_updated_at
    before update on public.profiles
    for each row execute function public.handle_updated_at();

create trigger set_resumes_updated_at
    before update on public.resumes
    for each row execute function public.handle_updated_at();

create trigger set_interview_sessions_updated_at
    before update on public.interview_sessions
    for each row execute function public.handle_updated_at();

-- Automatic profile creation on auth.users sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name, email, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', 'Candidate'),
        new.email,
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_turns enable row level security;

-- Profiles Policies
create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Resumes Policies
create policy "Users can view their own resumes"
    on public.resumes for select
    using (auth.uid() = user_id);

create policy "Users can insert their own resumes"
    on public.resumes for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own resumes"
    on public.resumes for delete
    using (auth.uid() = user_id);

-- Interview Sessions Policies
create policy "Users can view their own interview sessions"
    on public.interview_sessions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own interview sessions"
    on public.interview_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own interview sessions"
    on public.interview_sessions for update
    using (auth.uid() = user_id);

-- Interview Turns Policies
create policy "Users can view turns of their own sessions"
    on public.interview_turns for select
    using (
        exists (
            select 1 from public.interview_sessions
            where interview_sessions.id = interview_turns.session_id
            and interview_sessions.user_id = auth.uid()
        )
    );

create policy "Users can insert turns of their own sessions"
    on public.interview_turns for insert
    with check (
        exists (
            select 1 from public.interview_sessions
            where interview_sessions.id = interview_turns.session_id
            and interview_sessions.user_id = auth.uid()
        )
    );

-- Storage bucket initialization (for resumes and interview-audio)
insert into storage.buckets (id, name, public)
values 
    ('resumes', 'resumes', false),
    ('interview-audio', 'interview-audio', false)
on conflict (id) do nothing;

-- Storage policies for authenticated user uploads
create policy "Allow authenticated users to upload resumes"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Allow users to view their own resumes"
    on storage.objects for select
    to authenticated
    using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Allow authenticated users to upload interview audio"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'interview-audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Allow users to view their own interview audio"
    on storage.objects for select
    to authenticated
    using (bucket_id = 'interview-audio' and (storage.foldername(name))[1] = auth.uid()::text);
