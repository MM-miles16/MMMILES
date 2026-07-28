-- The applicant's chosen host name must remain separate from the identity
-- name returned by DigiLocker. No Aadhaar number is collected or stored.
alter table public.host_kyc_verifications
  add column if not exists declared_name text;
