-- Social Proof Infrastructure + Gallery CMS
-- Sprint 2: Conversion Flow Rewire

-- ── SOCIAL PROOF ──────────────────────────────────────────────────────────────

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  author_name text not null,
  author_title text,
  practice_name text,
  practice_location text,
  quote text not null,
  short_quote text,
  rating integer check (rating between 1 and 5),
  result_metric text,
  result_value text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  source text not null default 'manual' check (source in ('manual', 'google', 'facebook', 'calendly', 'import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_studies_public (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  title text not null,
  slug text unique,
  practice_type text,
  practice_size text,
  challenge text not null,
  solution text not null,
  result_summary text not null,
  revenue_recovered numeric(12,2),
  recall_rate_improvement numeric(5,2),
  treatment_acceptance_improvement numeric(5,2),
  timeframe_weeks integer,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_proof_metrics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  sub_label text,
  icon text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- seed placeholder metrics (admin can update these)
insert into public.social_proof_metrics (label, value, sub_label, icon, sort_order, is_published) values
  ('Average Revenue Opportunity', '$18,400', 'per practice identified', 'trending-up', 1, true),
  ('Assessment Completions', '200+', 'practices assessed', 'clipboard-check', 2, true),
  ('Average Practice Health Score', '74/100', 'at baseline assessment', 'heart-pulse', 3, true)
on conflict do nothing;

-- ── GALLERY CMS ───────────────────────────────────────────────────────────────

create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.gallery_categories (slug, label, description, sort_order, is_active) values
  ('problem',     'Problem',     'Revenue leaks and missed opportunities',           1, true),
  ('opportunity', 'Opportunity', 'Where growth exists in the practice',              2, true),
  ('liz-insight', 'LIZ Insight', 'Advisor recommendations and opportunity cards',   3, true),
  ('action',      'Action',      'Patient engagement and follow-up workflows',       4, true),
  ('result',      'Result',      'Outcomes, growth metrics, and success stories',    5, true)
on conflict (slug) do nothing;

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.gallery_categories(id) on delete cascade,
  title text not null,
  caption text not null,
  image_url text,
  image_alt text,
  stat_label text,
  stat_value text,
  cta_label text,
  cta_href text,
  component_type text not null default 'image' check (component_type in ('image', 'liz-card', 'score-card', 'metric-card')),
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- seed gallery with the current hardcoded slides
insert into public.gallery_items (category_id, title, caption, image_url, image_alt, component_type, is_featured, is_published, sort_order)
select
  gc.id,
  'Missed Opportunities Add Up',
  'Revenue opportunities disappear from your practice every day — silently.',
  'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=900&q=80',
  'Empty dental operatory prepared for patient care',
  'image',
  true,
  true,
  1
from public.gallery_categories gc where gc.slug = 'problem'
on conflict do nothing;

insert into public.gallery_items (category_id, title, caption, image_url, image_alt, component_type, is_featured, is_published, sort_order)
select
  gc.id,
  'Patients Fall Through The Cracks',
  'Inactive patients often represent the largest hidden growth opportunity.',
  'https://images.unsplash.com/photo-1588776814546-1ffbb172d8e5?auto=format&fit=crop&w=900&q=80',
  'Dental patient consultation',
  'image',
  true,
  true,
  2
from public.gallery_categories gc where gc.slug = 'opportunity'
on conflict do nothing;

insert into public.gallery_items (category_id, title, caption, image_url, image_alt, component_type, is_featured, is_published, sort_order)
select
  gc.id,
  'LIZ Identifies What Matters',
  'See exactly where your revenue opportunities exist — prioritized by impact.',
  null,
  null,
  'liz-card',
  true,
  true,
  3
from public.gallery_categories gc where gc.slug = 'liz-insight'
on conflict do nothing;

insert into public.gallery_items (category_id, title, caption, image_url, image_alt, component_type, is_featured, is_published, sort_order)
select
  gc.id,
  'Action Creates Growth',
  'Consistent, intelligent follow-up drives better outcomes for patients and practices.',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80',
  'Dental patient care moment',
  'image',
  true,
  true,
  4
from public.gallery_categories gc where gc.slug = 'action'
on conflict do nothing;

insert into public.gallery_items (category_id, title, caption, image_url, image_alt, component_type, is_featured, is_published, sort_order)
select
  gc.id,
  'Predictable, Measurable Growth',
  'Know where to focus next. Every week, every month.',
  null,
  null,
  'score-card',
  true,
  true,
  5
from public.gallery_categories gc where gc.slug = 'result'
on conflict do nothing;

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.testimonials enable row level security;
alter table public.case_studies_public enable row level security;
alter table public.social_proof_metrics enable row level security;
alter table public.gallery_categories enable row level security;
alter table public.gallery_items enable row level security;

-- public read for published content
create policy "public_read_testimonials" on public.testimonials
  for select using (is_published = true);

create policy "public_read_case_studies" on public.case_studies_public
  for select using (is_published = true);

create policy "public_read_social_metrics" on public.social_proof_metrics
  for select using (is_published = true);

create policy "public_read_gallery_categories" on public.gallery_categories
  for select using (is_active = true);

create policy "public_read_gallery_items" on public.gallery_items
  for select using (is_published = true);

-- service role full access
create policy "service_role_all_testimonials" on public.testimonials
  for all using (auth.role() = 'service_role');

create policy "service_role_all_case_studies" on public.case_studies_public
  for all using (auth.role() = 'service_role');

create policy "service_role_all_social_metrics" on public.social_proof_metrics
  for all using (auth.role() = 'service_role');

create policy "service_role_all_gallery_categories" on public.gallery_categories
  for all using (auth.role() = 'service_role');

create policy "service_role_all_gallery_items" on public.gallery_items
  for all using (auth.role() = 'service_role');

-- ── INDEXES ───────────────────────────────────────────────────────────────────

create index if not exists idx_testimonials_published on public.testimonials(is_published, sort_order);
create index if not exists idx_case_studies_published on public.case_studies_public(is_published, sort_order);
create index if not exists idx_gallery_items_published on public.gallery_items(is_published, sort_order);
create index if not exists idx_gallery_items_category on public.gallery_items(category_id);
