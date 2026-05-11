# KitFlow — Supabase Setup

## Steps to connect a new client

### 1. Create a Supabase project
Go to https://supabase.com, create a new project, and note your:
- Project URL  (`https://xxxx.supabase.co`)
- Anon public key (under Settings → API)

### 2. Run the SQL files in order
Open the Supabase SQL Editor and run each file **in this exact order**:

1. `supabase/schema.sql`   — all tables, indexes, RLS policies, views
2. `supabase/functions.sql` — atomic Postgres RPC functions

### 3. Configure the app
Copy `.env.example` to `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Then update `src/config.js` for this client:
```js
clientName:    'Prime Sports',
clientSub:     'Soccer Academy',
clientLogoUrl: 'https://your-cdn.com/logo.png',
brandColor:    '#2563EB',
```

### 4. Authentication
KitFlow uses Supabase Auth. In your Supabase project:
- Go to Authentication → Providers → enable Email
- Create user accounts for each staff member (kit manager, admin)
- Optionally enable Google/phone auth

All RLS policies require `auth.role() = 'authenticated'` so
unauthenticated users see nothing even if they have the anon key.

### 5. Onboarding a second client
- Create a second Supabase project
- Run both SQL files again in the new project  
- Set the new project's URL and key in `.env`
- Update `src/config.js` with the new client name, logo, and brand colour
- Deploy — done.

## Database overview

| Table           | Description                                      |
|-----------------|--------------------------------------------------|
| categories      | User-managed sport/equipment categories          |
| equipment       | Inventory register                               |
| borrowers       | Player and staff profiles                        |
| checkouts       | Checkout transactions                            |
| return_lines    | Split return lines per checkout                  |
| repairs         | Repair tickets                                   |
| events          | Calendar events                                  |
| event_packing   | Equipment packing list per event                 |
| activity_log    | Append-only audit trail                          |

## Useful views (already created by schema.sql)

```sql
select * from active_checkouts_view;   -- all active/partial checkouts
select * from low_stock_view;          -- equipment below min threshold
select * from open_repairs_view;       -- pending and in-progress repairs
```
