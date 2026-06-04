-- Add the canonical platform administrator profile role.
-- This preserves client access lockdown, RLS, subscription gates, and existing org membership roles.

alter type public.profile_role add value if not exists 'platform_admin';
