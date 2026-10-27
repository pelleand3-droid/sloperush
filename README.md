# Slope Rush

The web version is published at https://pelleand3-droid.github.io/sloperush/.

## Publishing updates

The GitHub Pages workflow deploys the game files whenever changes are pushed to
the `main` branch. Players using the launcher will get the latest published
version the next time they open the game, provided they have an internet
connection.

The workflow publishes only `index.html`, `game.js`, `style.css`, and
`supabase-config.js`. Never put a Supabase service-role key or other secret in
these public game files.

The Windows launcher opens the hosted game. Rebuild and redistribute
`SlopeRush.exe` once to switch existing launcher users to the hosted version;
after that, game updates are published through GitHub Pages.
