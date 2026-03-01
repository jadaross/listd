# Listd — Manual Setup Steps

## What's already done
- `ANTHROPIC_API_KEY` — analysis + market intelligence
- `SERPAPI_KEY` — Vinted & Depop live pricing

---

## 1. Supabase (required for eBay OAuth)

The eBay connect flow uses Supabase for anonymous sessions and storing encrypted tokens. Without it, "Connect eBay account" will error.

### Create a project
1. Go to [supabase.com](https://supabase.com) → New project
2. Copy the following into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
   All three are under **Project Settings → API**.

### Create the database table
Run this in the **Supabase SQL Editor** (Project → SQL Editor → New query):

```sql
create table platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  access_token_enc text not null,
  refresh_token_enc text not null,
  expires_at timestamptz not null,
  platform_username text,
  updated_at timestamptz default now(),
  unique (user_id, platform)
);

-- Allow the service role full access (used server-side)
alter table platform_connections enable row level security;

create policy "service role bypass" on platform_connections
  using (true)
  with check (true);
```

### Enable anonymous sign-in
In the Supabase dashboard: **Authentication → Providers → Anonymous** → toggle on.

---

## 2. eBay Developer Portal

You've been approved. Now wire up the credentials.

### Get your keys
1. Go to [developer.ebay.com](https://developer.ebay.com) → **My Account → Application Keys**
2. You'll see **Sandbox** and **Production** key sets — use **Sandbox** for local dev first
3. Copy into `.env.local`:
   ```
   EBAY_CLIENT_ID=your-sandbox-app-id
   EBAY_CLIENT_SECRET=your-sandbox-cert-id
   EBAY_ENVIRONMENT=sandbox
   ```

### Create a RuName (OAuth redirect alias)
eBay requires a named redirect URI — you can't just pass a raw URL.

1. In the developer portal: **My Account → User Tokens → Get a Token from eBay via Your Application**
2. Click **Add eBay Redirect URL**
3. Set the redirect URL to:
   ```
   http://localhost:3001/api/auth/ebay/callback
   ```
4. Give it any name, e.g. `listd-local`
5. Copy the **RuName** value (looks like `Firstname_Lastname-listd-l-abcdef`) into `.env.local`:
   ```
   EBAY_RU_NAME=Firstname_Lastname-listd-l-abcdef
   ```

### Generate the token encryption secret
This is a random 32-byte key used to AES-encrypt stored tokens. Generate it once:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output into `.env.local`:
```
EBAY_TOKEN_SECRET=the64hexcharshere
```

---

## 3. App URL

```
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

This is used to build the OAuth callback redirect. Update to your production URL when deploying.

---

## Final `.env.local` checklist

```
ANTHROPIC_API_KEY=✅ done
SERPAPI_KEY=✅ done

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_RU_NAME=
EBAY_TOKEN_SECRET=
EBAY_ENVIRONMENT=sandbox

NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## Testing the eBay flow

Once all vars are set:
1. Restart the dev server (`npm run dev`)
2. Click **"Connect eBay account"** in the app header
3. You'll be redirected to eBay's sandbox login — use your **sandbox test buyer account** (create one at developer.ebay.com → Sandbox → User Tokens → Create a test account)
4. After authorising, you'll be redirected back and see "eBay connected" toast

---

## Production (later)

When moving to production:
- Switch to **Production** eBay app keys
- Create a new RuName pointing to your production domain
- Change `EBAY_ENVIRONMENT=production`
- Update `NEXT_PUBLIC_APP_URL` to your Vercel/production URL
- The eBay Sell Inventory API is only available on production — sandbox will create draft listings but won't publish
