create table if not exists public.google_form_imports (
  id uuid primary key default gen_random_uuid(),
  sheet_row_number integer,
  form_timestamp text,
  phone text,
  imported_order_id uuid references public.orders(id) on delete set null,
  imported_at timestamptz,
  status text not null check (status in ('imported', 'duplicate', 'error', 'pending_review')),
  error_message text,
  duplicate_key text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists google_form_imports_duplicate_key_unique
on public.google_form_imports (duplicate_key);

create index if not exists google_form_imports_status_created_at_idx
on public.google_form_imports (status, created_at desc);

create index if not exists google_form_imports_sheet_row_number_idx
on public.google_form_imports (sheet_row_number)
where sheet_row_number is not null;

create index if not exists google_form_imports_timestamp_phone_idx
on public.google_form_imports (form_timestamp, phone)
where form_timestamp is not null and phone is not null;

alter table public.google_form_imports enable row level security;

grant select on table public.google_form_imports to authenticated;

drop policy if exists "authenticated can read google form imports" on public.google_form_imports;
create policy "authenticated can read google form imports"
on public.google_form_imports for select
to authenticated
using (true);
