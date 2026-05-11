-- ============================================================
--  KitFlow — Supabase RPC Functions
--  Run AFTER schema.sql in the Supabase SQL editor.
-- ============================================================


-- ── 1. Atomic available adjustment ───────────────────────────
-- Prevents race conditions when multiple checkouts happen at
-- the same time. Called by the app instead of a plain update.
create or replace function adjust_equipment_available(eq_id uuid, delta integer)
returns void
language plpgsql
security definer
as $$
begin
  update equipment
  set
    available = greatest(0, available + delta),
    status    = case
                  when (available + delta) <= 0 then 'Checked Out'
                  else 'In Store'
                end
  where id = eq_id;
end;
$$;


-- ── 2. Full checkout transaction ──────────────────────────────
-- Issues equipment and decrements stock in a single atomic
-- transaction. Use this instead of two separate calls.
create or replace function issue_equipment(
  p_equipment_id   uuid,
  p_equipment_name text,
  p_borrower_id    uuid,
  p_borrower_name  text,
  p_id_number      text,
  p_phone          text,
  p_qty            integer,
  p_issued_at      timestamptz,
  p_issued_date    date,
  p_due_date       date,
  p_coach          text default null,
  p_team           text default null,
  p_notes          text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_available integer;
  v_checkout_id uuid;
begin
  -- Lock the equipment row and check availability
  select available into v_available
  from equipment
  where id = p_equipment_id
  for update;

  if v_available < p_qty then
    raise exception 'Insufficient stock: % available, % requested', v_available, p_qty;
  end if;

  -- Insert checkout
  insert into checkouts (
    equipment_id, equipment_name,
    borrower_id,  borrower_name,
    id_number,    phone,
    qty, issued_at, issued_date, due_date,
    coach, team, notes, status
  ) values (
    p_equipment_id, p_equipment_name,
    p_borrower_id,  p_borrower_name,
    p_id_number,    p_phone,
    p_qty, p_issued_at, p_issued_date, p_due_date,
    p_coach, p_team, p_notes, 'Active'
  )
  returning id into v_checkout_id;

  -- Decrement available
  update equipment
  set
    available = available - p_qty,
    status    = case when (available - p_qty) = 0 then 'Checked Out' else status end
  where id = p_equipment_id;

  -- Log activity
  insert into activity_log (type, text, detail, color)
  values (
    'checkout',
    p_equipment_name || ' ×' || p_qty || ' issued to ' || p_borrower_name,
    'Team: ' || coalesce(p_team, '—') || ' · Coach: ' || coalesce(p_coach, '—'),
    'info'
  );

  return v_checkout_id;
end;
$$;


-- ── 3. Full return transaction ────────────────────────────────
-- Returns equipment, inserts return lines, creates repair
-- tickets for damaged items, adjusts stock — all atomically.
create or replace function process_return(
  p_checkout_id uuid,
  p_lines       jsonb    -- [{ qty, condition, notes, returned_at }]
)
returns void
language plpgsql
security definer
as $$
declare
  v_checkout       record;
  v_equipment      record;
  v_line           jsonb;
  v_good_qty       integer := 0;
  v_lost_qty       integer := 0;
  v_total_returned integer := 0;
  v_new_status     text;
begin
  -- Fetch checkout
  select * into v_checkout from checkouts where id = p_checkout_id for update;
  if not found then
    raise exception 'Checkout % not found', p_checkout_id;
  end if;

  -- Fetch equipment
  select * into v_equipment from equipment where id = v_checkout.equipment_id for update;

  -- Process each return line
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into return_lines (checkout_id, qty, condition, notes, returned_at)
    values (
      p_checkout_id,
      (v_line->>'qty')::integer,
      v_line->>'condition',
      v_line->>'notes',
      (v_line->>'returned_at')::timestamptz
    );

    v_total_returned := v_total_returned + (v_line->>'qty')::integer;

    case v_line->>'condition'
      when 'Good' then
        v_good_qty := v_good_qty + (v_line->>'qty')::integer;
      when 'Damaged' then
        -- Auto-create repair ticket
        insert into repairs (equipment_id, equipment_name, problem, status, notes, logged_at)
        values (
          v_checkout.equipment_id,
          v_checkout.equipment_name,
          coalesce(v_line->>'notes', 'Returned damaged — no description'),
          'Pending',
          'Auto-created from checkout return ' || p_checkout_id::text,
          now()
        );
      when 'Lost' then
        v_lost_qty := v_lost_qty + (v_line->>'qty')::integer;
      else null;
    end case;
  end loop;

  -- Update checkout status
  v_new_status := case when v_total_returned >= v_checkout.qty then 'Returned' else 'Partial' end;
  update checkouts
  set status = v_new_status, returned_date = now()
  where id = p_checkout_id;

  -- Update equipment stock
  update equipment
  set
    available = greatest(0, available + v_good_qty),
    total     = greatest(0, total - v_lost_qty),
    status    = case
                  when (available + v_good_qty) > 0 then 'In Store'
                  else status
                end
  where id = v_checkout.equipment_id;

  -- Log activity
  insert into activity_log (type, text, detail, color)
  values (
    'checkin',
    v_checkout.equipment_name || ' returned by ' || v_checkout.borrower_name,
    'Good: ' || v_good_qty || ' · Lost: ' || v_lost_qty,
    case when v_good_qty > 0 then 'ok' else 'warn' end
  );
end;
$$;


-- ── 4. Grant execute to authenticated users ───────────────────
grant execute on function adjust_equipment_available(uuid, integer) to authenticated;
grant execute on function issue_equipment(uuid, text, uuid, text, text, text, integer, timestamptz, date, date, text, text, text) to authenticated;
grant execute on function process_return(uuid, jsonb) to authenticated;
