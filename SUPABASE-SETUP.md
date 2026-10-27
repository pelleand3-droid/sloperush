# Slope Rush online accounts and leaderboard

Online play requires a Supabase project. Accounts and scores will not sync until this project is configured.

## Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. Open the project's **SQL Editor**, paste in `SUPABASE-SETUP.sql`, and run it once. If you already set up Slope Rush, run `SUPABASE-DAILY-LEADERBOARD.sql` once instead to add the daily board.
3. In **Project Settings → API**, copy the **Project URL** and the **publishable/anon key**.
4. Put those two public client values in `supabase-config.js`:

   ```js
   window.SLOPE_RUSH_SUPABASE = {
     url: 'https://YOUR-PROJECT.supabase.co',
     anonKey: 'YOUR_PUBLISHABLE_OR_ANON_KEY',
   };
   ```

5. Run `Build-SlopeRush.bat` to rebuild `SlopeRush.exe`. The configuration is packaged into the executable.
6. Start the executable, create an account with an email, display name, country code, and password, then verify the email if Supabase requests it.

Only the Supabase **publishable/anon** key belongs in the game. Never put a `service_role` key, database password, or players' passwords in the game or a file. Supabase Auth handles passwords; this app only sends them to Supabase over HTTPS to create or sign in to an account.

The public leaderboard has Daily and All time tabs. Daily ranks each player's best submitted score for the current UTC day and resets at midnight UTC; All time ranks each player's best submitted score. Both display only display name, country, and score, never email addresses or passwords. Players can choose a display name that is not their real name. Scores are submitted by the game client, so this is a casual leaderboard and is not cheat-proof.

If you publish the game, include a privacy notice explaining that account email is handled by Supabase and that display name, country, and scores are public.
