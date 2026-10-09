-- GTOPs dashboard future-ready Supabase schema.
-- Apply this in the Supabase SQL editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists learners (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  first_name text,
  last_name text,
  email text unique,
  cohort text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists learner_activity_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  avg_hours_per_learner numeric,
  avg_monthly_learning_hours numeric,
  learners_making_progress integer,
  source text not null check (source in ('manual', 'coursera-api', 'derived')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists coursera_enrollments (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete cascade,
  coursera_user_id text,
  course_id text not null,
  course_name text,
  enrolled_at timestamptz,
  completed_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table if not exists coursera_course_progress (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete cascade,
  course_id text not null,
  course_name text,
  progress_percent numeric,
  learning_hours numeric,
  last_activity_at timestamptz,
  raw jsonb,
  captured_at timestamptz not null default now()
);

create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete cascade,
  certification_name text not null,
  issuer text,
  completed_at date,
  evidence_url text,
  created_at timestamptz not null default now()
);

create table if not exists placements (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete cascade,
  placement_type text,
  employer text,
  role_title text,
  placement_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists learner_alerts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete cascade,
  alert_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null default 'open',
  message text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists impact_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  metric_label text not null,
  metric_value numeric not null,
  metric_unit text,
  source text not null default 'manual',
  visible_publicly boolean not null default true,
  captured_at timestamptz not null default now()
);

create table if not exists sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  source text not null,
  status text not null check (status in ('success', 'failed', 'running')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  metadata jsonb
);

create table if not exists xapi_statements (
  id uuid primary key default gen_random_uuid(),
  statement_id text unique,
  received_at timestamptz not null default now(),
  occurred_at timestamptz,
  actor_mbox text,
  verb_id text,
  object_id text,
  course_id text,
  item_type text,
  program_id text,
  scaled_score numeric,
  success boolean,
  completion boolean,
  raw jsonb not null
);

create index if not exists xapi_statements_received_at_idx on xapi_statements (received_at desc);
create index if not exists xapi_statements_actor_mbox_idx on xapi_statements (actor_mbox);
create index if not exists xapi_statements_verb_id_idx on xapi_statements (verb_id);
create index if not exists xapi_statements_course_id_idx on xapi_statements (course_id);
create index if not exists xapi_statements_completion_idx on xapi_statements (completion);

alter table learners enable row level security;
alter table learner_activity_snapshots enable row level security;
alter table coursera_enrollments enable row level security;
alter table coursera_course_progress enable row level security;
alter table certifications enable row level security;
alter table placements enable row level security;
alter table learner_alerts enable row level security;
alter table impact_metrics enable row level security;
alter table sync_runs enable row level security;
alter table xapi_statements enable row level security;

-- Keep raw learner/program records private. Server-side code uses the service role key.
drop policy if exists "No public learner access" on learners;
create policy "No public learner access" on learners for all using (false) with check (false);

drop policy if exists "No public learner activity snapshot access" on learner_activity_snapshots;
create policy "No public learner activity snapshot access" on learner_activity_snapshots for all using (false) with check (false);

drop policy if exists "No public Coursera enrollment access" on coursera_enrollments;
create policy "No public Coursera enrollment access" on coursera_enrollments for all using (false) with check (false);

drop policy if exists "No public Coursera progress access" on coursera_course_progress;
create policy "No public Coursera progress access" on coursera_course_progress for all using (false) with check (false);

drop policy if exists "No public certification access" on certifications;
create policy "No public certification access" on certifications for all using (false) with check (false);

drop policy if exists "No public placement access" on placements;
create policy "No public placement access" on placements for all using (false) with check (false);

drop policy if exists "No public learner alert access" on learner_alerts;
create policy "No public learner alert access" on learner_alerts for all using (false) with check (false);

drop policy if exists "No public impact metric table access" on impact_metrics;
create policy "No public impact metric table access" on impact_metrics for all using (false) with check (false);

drop policy if exists "No public sync run access" on sync_runs;
create policy "No public sync run access" on sync_runs for all using (false) with check (false);

drop policy if exists "No public xAPI statement access" on xapi_statements;
create policy "No public xAPI statement access" on xapi_statements for all using (false) with check (false);

create or replace view public_dashboard_metrics as
select
  count(distinct actor_mbox) filter (where actor_mbox is not null) as learners_activated,
  count(*) filter (where completion is true) as completions,
  count(*) filter (where verb_id ilike '%progressed%') as progress_events,
  count(*) filter (where verb_id ilike '%completed%' or completion is true) as completion_events,
  count(distinct actor_mbox) filter (
    where received_at >= now() - interval '14 days'
      and actor_mbox is not null
  ) as learners_active_14d,
  max(received_at) as last_xapi_received_at
from xapi_statements;
