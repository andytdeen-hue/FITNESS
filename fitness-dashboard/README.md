# Fitness Dashboard — private, multi-device starter application

A deployable web application for morning weigh-ins, nutrition, activity and a projected date to reach 230 lb. Works in desktop and mobile browsers. **Not yet deployed or connected to Apple Health**. Do not publish before completing the setup below.

## Included
- Email/password sign-in via Supabase Authentication, with Row Level Security (RLS) for per-user privacy.
- Supabase-hosted daily weight, steps, active energy, workout energy, and food entries; shared between phone and desktop.
- Daily calorie allowance: baseline + up to 50% of **active energy above normal activity baseline**, capped; avoids double-counting steps and workout energy. A recent weight trend can make an additional adjustment of at most ±150 kcal/day. Defaults are estimates; adjust with care.
- Actual weight chart, target trajectory, recent-trend forecast, predicted goal date and estimated December 31 weight. Forecast requires >=5 weigh-ins over >=10 days. No credible ETA is shown when the trend is flat/rising or insufficient.
- Seven-day training schedule, macro targets, CSV backups.
- Serverless HTTPS endpoint `/api/health-sync` accepts **normalized daily summary JSON**, with bearer-token authentication; does not accept raw Health Auto Export payloads yet.

## Deployment: Supabase + Netlify (no command line required if using GitHub)
1. Create a Supabase project at https://supabase.com/dashboard. Copy **Project URL** and **publishable/anon key** from project settings. Never put the `service_role` key in the website or public repo.
2. In Supabase SQL Editor, run `supabase/schema.sql`. This enables RLS on all three tables.
3. In Supabase Authentication > Users, **create your user** and confirm the email. In Authentication > Providers > Email, disable new signups after creating the account (and configure email verification according to your preference). Keep the site URL and redirect URLs configured for your Netlify domain.
4. Copy your user's UUID from Supabase Authentication > Users. This is the server-only `HEALTH_USER_ID`.
5. Push this folder to a **private GitHub repository**. On Netlify, choose **Add new project > Import an existing project**, connect the repository, and use the included `netlify.toml` build settings. Drag-and-drop ZIP deployment will not install functions or build the app.
6. In Netlify > Project configuration > Environment variables, set:
   - `SUPABASE_URL` = Supabase Project URL
   - `SUPABASE_ANON_KEY` = Supabase publishable/anon key (public by design)
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service role key (**secret, server only**)
   - `HEALTH_USER_ID` = your Auth user UUID (**server only**)
   - `HEALTH_SYNC_TOKEN` = random long secret (at least 32 random bytes; **server only**)
7. Deploy the site. Open the Netlify URL on desktop and phone and sign in with the same account. Add a weigh-in and confirm it appears on both devices.
8. **Important privacy:** The sign-in protects the database, but the HTML landing page remains publicly accessible; the content only loads after login. Disable public signups. Enable MFA if available. Protect Netlify environment variables and your Supabase account.

## Apple Health sync: next connection step
Apple Health is not readable directly by Safari. An iPhone HealthKit export app must collect and send your data. The included Netlify endpoint accepts this *normalized* JSON with `Authorization: Bearer <HEALTH_SYNC_TOKEN>`:

```json
{"days":[{"day":"2026-11-16","weight_lb":238.4,"steps":10200,"active_kcal":840,"workout_kcal":350}]}
```

`workout_kcal` is for display only. **Do not add it to `active_kcal`**. The endpoint accepts up to 14 daily records per call, merges existing activity/weight fields, and does not overwrite food diary data. A Health Auto Export REST API automation may send a different payload structure: you **must add an adapter** matching its actual export schema (or an iPhone Shortcut that transforms it) before automatic syncing will work. Do not assume the app's raw JSON works with this endpoint. A successful test with the normalized payload establishes only that the receiver works.

Example test (use terminal, never share the secret):

```bash
curl -X POST 'https://YOUR-SITE.netlify.app/api/health-sync' \
 -H 'Content-Type: application/json' \
 -H 'Authorization: Bearer YOUR_SECRET_TOKEN' \
 --data '{"days":[{"day":"2026-11-16","steps":10000,"active_kcal":800}]}'
```

## Accuracy and safety
- The forecast is a simple recent linear regression, **not a physiological prediction**. Daily water fluctuations, post-race recovery and changes in training can affect it.
- Baseline calories and exercise credits are adjustable estimates. Avoid aggressive changes based on one weigh-in. Consult your care team for individualized calorie targets if needed.
- Only calories logged **in this app** are included in food totals. MyFitnessPal is **not automatically connected**; importing Apple Health dietary energy is a future integration.
- Current UI uses a CDN for the Supabase browser library; network access is required. The site is not an offline-first application.
