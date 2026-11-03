# STARWELL

STARWELL is a zero-gravity arcade survival game. Steer a small ship through a
star system collapsing toward a central black hole, collect luminous fragments,
and stay ahead of incoming debris. The game update files are published at
https://pelleand3-droid.github.io/sloperush/.

## Flight and scoring

Use **WASD** or the **arrow keys** to thrust. Your ship has inertia: release the
controls to drift, and steer against your momentum to slow down. Press **Space**
or **Burst** for a quick directional acceleration; the burst recharges after
2.4 seconds. Avoid the black hole, debris, and the edge of the flight zone.
Survival time and collected fragments both add to your signal score.

On touch screens, use the on-screen direction pad and Burst button. The game
keeps the existing online accounts, personal bests, leaderboards, daily
challenges, and XP rewards.

## Extra XP

Collecting a fragment awards 10 XP. Completing a challenge awards 10 XP.
Reaching each 1,000-point score milestone awards another 100 XP. XP and
unlocked ship colors are stored on each player's device.

## Background music

STARWELL plays an original synthesized music loop. Use the music icon in the
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

The leaderboard includes Last hour (rolling 60-minute window), Daily (midnight
UTC reset), and All time tabs. After updating an existing Supabase project, run
`SUPABASE-DAILY-LEADERBOARD.sql` once in its SQL Editor to enable the recent
boards.
