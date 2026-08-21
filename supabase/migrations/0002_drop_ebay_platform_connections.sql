-- Drop the eBay OAuth token store.
--
-- `platform_connections` held per-user eBay access/refresh tokens, encrypted
-- with AES-256-GCM. The whole eBay integration was removed in ADR-0003 and the
-- code that read this table no longer exists, so the table is dead weight
-- holding encrypted credentials for an integration that is gone.
--
-- Safe to run against a database that never had it: `if exists` makes this a
-- no-op on a fresh project.

drop table if exists public.platform_connections cascade;
