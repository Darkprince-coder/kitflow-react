-- ============================================================
--  KitFlow — Supabase Schema
--  Run this entire file in the Supabase SQL editor once.
--  Order matters — foreign keys reference earlier tables.
-- ============================================================

-- ── Enable UUID extension (already on by default in Supabase) ──
create extension if not exists "uuid-ossp";


-- ============================================================
--  1. CATEGORIES
--  User-managed list of sport / equipment categories.
-- ============================================================
create table if not exists categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- Seed default categories
insert into categories (name) values
  ('Football'), ('Rugby'), ('Netball'), ('Volleyball'),
  ('Badminton'), ('Tennis'), ('Athletics'), ('Medical'), ('General')
on conflict (name) do nothing;


-- ============================================================
--  2. EQUIPMENT
-- ============================================================
create table if not exists equipment (
  id           uuid primary key default uuid_generate_v4(),
  name         text        not null,
  category     text        not null,                          -- matches categories.name
  total        integer     not null default 0 check (total >= 0),
  available    integer     not null default 0 check (available >= 0),
  min_stock    integer     not null default 2 check (min_stock >= 0),
  condition    text        not null default 'Good'
                           check (condition in ('New','Good','Fair','Poor')),
  status       text        not null default 'In Store'
                           check (status in ('In Store','Checked Out','Under Repair','Lost')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Keep updated_at fresh automatically
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger equipment_updated_at
  before update on equipment
  for each row execute function set_updated_at();

create index if not exists equipment_category_idx on equipment (category);
create index if not exists equipment_status_idx   on equipment (status);


-- ============================================================
--  3. BORROWERS
-- ============================================================
create table if not exists borrowers (
  id           uuid primary key default uuid_generate_v4(),
  name         text        not null,
  id_number    text        not null unique,                   -- national ID / staff card
  phone        text        not null,
  emergency    text,                                          -- emergency contact phone
  role         text        not null default 'Player'
                           check (role in ('Player','Staff','Coach','Volunteer')),
  team         text,
  notes        text,
  join_date    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger borrowers_updated_at
  before update on borrowers
  for each row execute function set_updated_at();

create index if not exists borrowers_id_number_idx on borrowers (id_number);
create index if not exists borrowers_name_idx      on borrowers (lower(name));


-- ============================================================
--  4. CHECKOUTS
--  One row per checkout transaction.
-- ============================================================
create table if not exists checkouts (
  id             uuid primary key default uuid_generate_v4(),
  equipment_id   uuid        not null references equipment(id) on delete restrict,
  equipment_name text        not null,                        -- denormalised for fast display
  borrower_id    uuid        not null references borrowers(id) on delete restrict,
  borrower_name  text        not null,
  id_number      text        not null,
  phone          text        not null,
  qty            integer     not null check (qty > 0),
  issued_at      timestamptz not null default now(),          -- precise timestamp
  issued_date    date        not null default current_date,
  due_date       date        not null,
  returned_date  timestamptz,
  coach          text,
  team           text,
  notes          text,
  status         text        not null default 'Active'
                             check (status in ('Active','Partial','Returned')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger checkouts_updated_at
  before update on checkouts
  for each row execute function set_updated_at();

create index if not exists checkouts_equipment_id_idx  on checkouts (equipment_id);
create index if not exists checkouts_borrower_id_idx   on checkouts (borrower_id);
create index if not exists checkouts_status_idx        on checkouts (status);
create index if not exists checkouts_due_date_idx      on checkouts (due_date);
create index if not exists checkouts_issued_at_idx     on checkouts (issued_at desc);


-- ============================================================
--  5. RETURN LINES
--  Split returns: one checkout can have multiple return lines
--  e.g. 9 Good + 1 Damaged in a single return transaction.
-- ============================================================
create table if not exists return_lines (
  id           uuid primary key default uuid_generate_v4(),
  checkout_id  uuid        not null references checkouts(id) on delete cascade,
  qty          integer     not null check (qty > 0),
  condition    text        not null
                           check (condition in ('Good','Damaged','Lost')),
  notes        text,
  returned_at  timestamptz not null default now(),            -- precise timestamp
  created_at   timestamptz not null default now()
);

create index if not exists return_lines_checkout_id_idx on return_lines (checkout_id);
create index if not exists return_lines_returned_at_idx on return_lines (returned_at desc);


-- ============================================================
--  6. REPAIRS
-- ============================================================
create table if not exists repairs (
  id             uuid primary key default uuid_generate_v4(),
  equipment_id   uuid        not null references equipment(id) on delete restrict,
  equipment_name text        not null,
  problem        text        not null,
  status         text        not null default 'Pending'
                             check (status in ('Pending','In Progress','Repaired','Not Repairable','Completed')),
  notes          text,
  logged_at      timestamptz not null default now(),
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger repairs_updated_at
  before update on repairs
  for each row execute function set_updated_at();

create index if not exists repairs_equipment_id_idx on repairs (equipment_id);
create index if not exists repairs_status_idx       on repairs (status);
create index if not exists repairs_logged_at_idx    on repairs (logged_at desc);


-- ============================================================
--  7. EVENTS (Calendar)
-- ============================================================
create table if not exists events (
  id         uuid primary key default uuid_generate_v4(),
  name       text        not null,
  date       date        not null,
  type       text        not null default 'Match'
                         check (type in ('Match','Training','Tournament','Term','Other')),
  sport      text        not null,
  venue      text        not null default 'Home'
                         check (venue in ('Home','Away','Neutral')),
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger events_updated_at
  before update on events
  for each row execute function set_updated_at();

create index if not exists events_date_idx on events (date);


-- ============================================================
--  8. EVENT PACKING LIST
--  Equipment items attached to a specific event.
-- ============================================================
create table if not exists event_packing (
  id             uuid primary key default uuid_generate_v4(),
  event_id       uuid        not null references events(id) on delete cascade,
  equipment_id   uuid        references equipment(id) on delete set null,
  equipment_name text        not null,
  category       text,
  qty            integer     not null check (qty > 0),
  notes          text,
  packed         boolean     not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists event_packing_event_id_idx on event_packing (event_id);


-- ============================================================
--  9. ACTIVITY LOG
--  Append-only audit trail of all operations.
-- ============================================================
create table if not exists activity_log (
  id         uuid primary key default uuid_generate_v4(),
  type       text        not null,   -- 'checkout','checkin','repair','equipment','calendar'
  text       text        not null,
  detail     text,
  color      text,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx on activity_log (created_at desc);


-- ============================================================
--  ROW LEVEL SECURITY (RLS)
--  All tables locked down. Access only via service_role key
--  (server/edge functions) or authenticated users.
--  Adjust policies below to match your auth model.
-- ============================================================

alter table categories    enable row level security;
alter table equipment     enable row level security;
alter table borrowers     enable row level security;
alter table checkouts     enable row level security;
alter table return_lines  enable row level security;
alter table repairs       enable row level security;
alter table events        enable row level security;
alter table event_packing enable row level security;
alter table activity_log  enable row level security;

-- ── Helper: is the current user authenticated? ──────────────
-- Every policy below uses this check so only signed-in users
-- can read or write anything.

-- READ policies (authenticated users can read everything)
create policy "auth_read_categories"    on categories    for select using (auth.role() = 'authenticated');
create policy "auth_read_equipment"     on equipment     for select using (auth.role() = 'authenticated');
create policy "auth_read_borrowers"     on borrowers     for select using (auth.role() = 'authenticated');
create policy "auth_read_checkouts"     on checkouts     for select using (auth.role() = 'authenticated');
create policy "auth_read_return_lines"  on return_lines  for select using (auth.role() = 'authenticated');
create policy "auth_read_repairs"       on repairs       for select using (auth.role() = 'authenticated');
create policy "auth_read_events"        on events        for select using (auth.role() = 'authenticated');
create policy "auth_read_event_packing" on event_packing for select using (auth.role() = 'authenticated');
create policy "auth_read_activity"      on activity_log  for select using (auth.role() = 'authenticated');

-- WRITE policies (authenticated users can insert/update/delete)
create policy "auth_insert_categories"    on categories    for insert with check (auth.role() = 'authenticated');
create policy "auth_insert_equipment"     on equipment     for insert with check (auth.role() = 'authenticated');
create policy "auth_insert_borrowers"     on borrowers     for insert with check (auth.role() = 'authenticated');
create policy "auth_insert_checkouts"     on checkouts     for insert with check (auth.role() = 'authenticated');
create policy "auth_insert_return_lines"  on return_lines  for insert with check (auth.role() = 'authenticated');
create policy "auth_insert_repairs"       on repairs       for insert with check (auth.role() = 'authenticated');
create policy "auth_insert_events"        on events        for insert with check (auth.role() = 'authenticated');
create policy "auth_insert_event_packing" on event_packing for insert with check (auth.role() = 'authenticated');
create policy "auth_insert_activity"      on activity_log  for insert with check (auth.role() = 'authenticated');

create policy "auth_update_equipment"     on equipment     for update using (auth.role() = 'authenticated');
create policy "auth_update_borrowers"     on borrowers     for update using (auth.role() = 'authenticated');
create policy "auth_update_checkouts"     on checkouts     for update using (auth.role() = 'authenticated');
create policy "auth_update_repairs"       on repairs       for update using (auth.role() = 'authenticated');
create policy "auth_update_events"        on events        for update using (auth.role() = 'authenticated');
create policy "auth_update_event_packing" on event_packing for update using (auth.role() = 'authenticated');
create policy "auth_update_return_lines"  on return_lines  for update using (auth.role() = 'authenticated');

create policy "auth_delete_events"        on events        for delete using (auth.role() = 'authenticated');
create policy "auth_delete_event_packing" on event_packing for delete using (auth.role() = 'authenticated');
create policy "auth_delete_categories"    on categories    for delete using (auth.role() = 'authenticated');


-- ============================================================
--  USEFUL VIEWS
-- ============================================================

-- Active checkouts with borrower details joined
create or replace view active_checkouts_view as
  select
    c.id,
    c.equipment_id,
    c.equipment_name,
    c.borrower_id,
    c.borrower_name,
    c.id_number,
    c.phone,
    c.qty,
    c.issued_at,
    c.due_date,
    c.coach,
    c.team,
    c.notes,
    c.status,
    b.emergency,
    b.role,
    (c.due_date < current_date) as is_overdue,
    (current_date - c.due_date) as days_overdue
  from checkouts c
  join borrowers b on b.id = c.borrower_id
  where c.status in ('Active', 'Partial');

-- Equipment low stock view
create or replace view low_stock_view as
  select *
  from equipment
  where available <= min_stock
    and status not in ('Lost', 'Under Repair');

-- Open repairs view
create or replace view open_repairs_view as
  select *
  from repairs
  where status in ('Pending', 'In Progress')
  order by logged_at asc;
