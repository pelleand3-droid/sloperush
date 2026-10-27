# Slope Rush

The game update files are published at https://pelleand3-droid.github.io/sloperush/.

## Background music

Slope Rush plays an original synthesized music loop. Use the Music button in the
top bar to turn it on or off. Playback starts after the first player interaction
to comply with browser autoplay restrictions; no separate audio file is needed.

## Publishing updates

The GitHub Pages workflow deploys the game files whenever changes are pushed to
the `main` branch. The Windows launcher downloads the latest files into a local
game folder when it starts, then opens that local copy in an Edge app window.
Players need an internet connection to get updates. If an update cannot be
downloaded, the launcher starts the last saved version when one is available.

The workflow publishes only `index.html`, `game.js`, `style.css`, and
`supabase-config.js`. Never put a Supabase service-role key or other secret in
these public game files.

Rebuild and redistribute `SlopeRush.exe` once to switch existing launcher users
to the auto-updating launcher; after that, game updates are published through
GitHub Pages.

The leaderboard includes Daily (midnight UTC reset) and All time tabs. After
updating an existing Supabase project, run `SUPABASE-DAILY-LEADERBOARD.sql` once
in its SQL Editor to enable the daily board.
