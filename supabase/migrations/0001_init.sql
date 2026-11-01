-- Nestwell schema. Balances and statuses are never stored — they're derived
-- at read time from tenancies, payments, charges and events (see
-- src/lib/domain). Rent rules and message templates live in
-- src/config/rules.ts, not in the database.

create extension if not exists pgcrypto;

create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,
  address text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete restrict,
  name text not null,
  type text not null check (type in ('triple', 'shared', 'single', 'studio')),
  rent_per_bed integer not null check (rent_per_bed > 0),
  reminder_mode text not null default 'manual' check (reminder_mode in ('auto', 'manual')),
  created_at timestamptz not null default now()
);

create table beds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete restrict,
  label text not null,
  created_at timestamptz not null default now()
);

create table tenants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  occupation text not null,
  next_of_kin_name text not null,
  next_of_kin_relation text not null,
  next_of_kin_phone text not null,
  emergency_contact text not null,
  photo_url text,
  licence_url text,
  gov_id_type text check (gov_id_type in ('nin_slip', 'international_passport', 'voters_card')),
  gov_id_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table tenancies (
  id uuid primary key default gen_random_uuid(),
  bed_id uuid not null references beds (id) on delete restrict,
  tenant_id uuid not null references tenants (id) on delete restrict,
  move_in date not null,
  rent integer not null check (rent > 0),
  deposit integer not null check (deposit >= 0),
  status text not null default 'active' check (status in ('active', 'notice', 'checked_out')),
  notice_reason text,
  move_out date,
  deposit_outcome text check (deposit_outcome in ('refund', 'partial', 'kept')),
  created_at timestamptz not null default now()
);

-- A bed holds at most one active (or notice) tenancy at a time.
create unique index tenancies_one_active_per_bed
  on tenancies (bed_id)
  where status in ('active', 'notice');

create table payments (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null references tenancies (id) on delete restrict,
  period_month date not null,
  amount integer not null check (amount > 0),
  method text not null check (method in ('transfer', 'cash')),
  paid_at timestamptz not null default now()
);

create table charges (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null references tenancies (id) on delete restrict,
  kind text not null check (kind in ('late_fee')),
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table broadcasts (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('portfolio', 'property', 'room', 'tenant')),
  scope_id uuid,
  template text not null check (template in ('rent_increase', 'maintenance', 'house_rules', 'general', 'blank')),
  body text not null,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid references tenancies (id) on delete restrict,
  broadcast_id uuid references broadcasts (id) on delete restrict,
  phone text not null,
  template text not null,
  body text not null,
  trigger text not null check (trigger in ('auto', 'manual', 'broadcast')),
  status text not null default 'ready' check (status in ('ready', 'opened', 'marked_sent')),
  wa_link text not null,
  created_at timestamptz not null default now()
);

-- Append-only activity log. Never updated or deleted.
create table events (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid references tenancies (id) on delete restrict,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index rooms_property_id_idx on rooms (property_id);
create index beds_room_id_idx on beds (room_id);
create index tenancies_bed_id_idx on tenancies (bed_id);
create index tenancies_tenant_id_idx on tenancies (tenant_id);
create index payments_tenancy_id_idx on payments (tenancy_id);
create index charges_tenancy_id_idx on charges (tenancy_id);
create index messages_tenancy_id_idx on messages (tenancy_id);
create index messages_broadcast_id_idx on messages (broadcast_id);
create index events_tenancy_id_idx on events (tenancy_id);
