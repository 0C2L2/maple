-- Only HTTP(S) websites with a DNS-style host and optional port/path are stored.
-- Reject credentials, whitespace, backslashes and executable/custom schemes.
-- Domain is already non-unique. Do not add an unnecessary domain ownership rule.
alter table public.organizations add constraint organizations_website_safe
check (website is null or website = '' or (
  website ~ '^https?://([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
  and website !~ '[[:cntrl:]\\]'
));
