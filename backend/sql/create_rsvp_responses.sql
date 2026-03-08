create table if not exists public.rsvp_responses (
  id bigint generated always as identity primary key,
  guest_name text not null,
  phone text null,
  attending boolean not null default true,
  events jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists rsvp_responses_submitted_at_idx
  on public.rsvp_responses (submitted_at desc);
