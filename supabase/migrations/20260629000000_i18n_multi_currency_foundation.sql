-- i18n + multi-currency foundation.
-- Adds organization defaults, profile preferences, and patient language preferences.

alter table public.organizations
  add column if not exists default_locale text not null default 'en-US',
  add column if not exists default_currency text not null default 'USD';

alter table public.profiles
  add column if not exists locale text not null default 'en-US',
  add column if not exists timezone text not null default 'America/Chicago',
  add column if not exists currency text not null default 'USD';

alter table if exists public.patients
  add column if not exists preferred_language text not null default 'en-US';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'organizations_default_locale_check') then
    alter table public.organizations
      add constraint organizations_default_locale_check
      check (default_locale in ('en-US', 'es-US', 'en-CA', 'fr-CA'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'organizations_default_currency_check') then
    alter table public.organizations
      add constraint organizations_default_currency_check
      check (default_currency in ('USD', 'CAD'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_locale_check') then
    alter table public.profiles
      add constraint profiles_locale_check
      check (locale in ('en-US', 'es-US', 'en-CA', 'fr-CA'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_currency_check') then
    alter table public.profiles
      add constraint profiles_currency_check
      check (currency in ('USD', 'CAD'));
  end if;

  if to_regclass('public.patients') is not null
     and not exists (select 1 from pg_constraint where conname = 'patients_preferred_language_check') then
    alter table public.patients
      add constraint patients_preferred_language_check
      check (preferred_language in ('en-US', 'es-US', 'en-CA', 'fr-CA'));
  end if;
end $$;

create index if not exists idx_organizations_default_locale on public.organizations(default_locale);
create index if not exists idx_profiles_locale on public.profiles(locale);

do $$
begin
  if to_regclass('public.patients') is not null then
    execute 'create index if not exists idx_patients_preferred_language on public.patients(preferred_language)';
  end if;
end $$;
