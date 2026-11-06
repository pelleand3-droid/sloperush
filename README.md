# Slope Rush Arcade

The original Slope Rush endless runner is restored as the main web game at
https://pelleand3-droid.github.io/sloperush/. The Windows launcher is also a
small game library: choose a game, download or update it, and launch it from
its own installed folder.

## Original Slope Rush controls

Use **Left / Right** or **A / D** to switch lanes, **Up** or **W** to jump, and
**Down** or **S** to crouch. On touch screens, use the on-screen controls.
Avoid hazards and try to beat your best score.

## Adding games to the launcher

The launcher reads its list from `games.json`. Each entry has a unique ID, a
display name, a short description, a `baseUrl`, and a list of relative files.
The files must include `index.html`; each game is downloaded into its own
folder under `%LOCALAPPDATA%\SlopeRush\games`.

To add a game:

1. Put its static web files in a folder under `games/` (for example,
   `games/my-game/`).
2. Add a catalog entry with that folder's published URL and every required
   file path.
3. Add the folder and `games.json` to the Pages deployment, then publish the
   site. The current workflow already deploys the complete `games/` folder.

The launcher includes **STARFIGHTER**, a self-contained space shooter in
`games/starfighter/`, and **ONLY UP**, an endless 3D climbing obby in
`games/only-up/`, alongside the original Slope Rush and BREAKWAVE. ONLY UP
uses a locally bundled Three.js renderer for a 3D third-person climbing course
with animated movement, mountain scenery, mouse-controlled turning, and sprinting.
The Three.js license is included in its game folder. Its course winds upward in
a circle around a scaffold tower, across narrow prop-top landings and tall
ledges that require a mantle. Sprint stamina is limited and recovers when the
player lets off Shift. In ONLY UP, A moves right and D moves left; arrow-key
directions are unchanged. Mouse movement turns the character and steers forward
movement; horizontal mouse turning is reversed from the previous version, and
A/D remain movement-only. Mouse sensitivity is adjustable in Settings and
saved locally. Jump inputs are buffered briefly and still work just after
stepping off a platform. Press or hold Space near the next tall ledge,
including while airborne, to mantle. Landing on a new platform no longer
rotates the camera.

The launcher only downloads games hosted under this project's HTTPS GitHub
Pages address. Keep game files self-contained or list every required asset in
the catalog. The catalog is cached locally so previously listed games remain
visible while offline; installing or updating still requires an internet
connection.

## Publishing

GitHub Pages deploys the main game, `games.json`, and every game folder when
changes are pushed to `main`. Never put a Supabase service-role key or other
secret in public game files.

The launcher checks the latest GitHub release for `SlopeRush.exe` at startup.
The launcher code is currently version `1.0.5`; publish it as a new release
with the updated executable so existing launcher users receive the game
library. Normal game updates do not need a new launcher release.
