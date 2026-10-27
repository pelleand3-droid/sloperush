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

The launcher checks the latest GitHub release at startup and replaces its own
executable when a newer `SlopeRush.exe` is available. It verifies the download
against GitHub's SHA-256 asset digest before installing it. Game-file updates
continue to come from GitHub Pages, so normal game changes do not need a new
launcher release.

Game startup requires the `v1.0.4` launcher. Older launchers and direct browser
visits show a mandatory update message with a download link instead of starting
the game. Users with an older launcher must download `v1.0.4` once. After that,
launcher and game-file updates are installed automatically on the next start,
provided the launcher is in a folder the user can write to and an internet
connection is available.

The leaderboard includes Daily (midnight UTC reset) and All time tabs. After
updating an existing Supabase project, run `SUPABASE-DAILY-LEADERBOARD.sql` once
in its SQL Editor to enable the daily board.
