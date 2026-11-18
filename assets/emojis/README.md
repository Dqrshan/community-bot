# Bot emojis

A 20-piece set built on the shared `shape.svg` decagon, with a top-to-bottom
gradient (lighter at the top, base color at the bottom) and a solid white glyph.

| Emoji | Glyph | Color |
| --- | --- | --- |
| `tick` | check | green |
| `cross` | cross | red |
| `warn` | exclamation | yellow |
| `info` | information | blurple |
| `staff` | shield-star | violet |
| `ticket` | ticket | purple |
| `idea` | speech bubble | blurple |
| `upvote` | thumbs up | green |
| `downvote` | thumbs down | red |
| `star` | star | gold |
| `pin` | pin | orange |
| `clock` | clock | blue |
| `link` | link | teal |
| `announce` | megaphone | indigo |
| `boost` | boost gem | pink |
| `gift` | gift | pink |
| `event` | calendar | violet |
| `welcome` | sparkles | green |
| `rules` | shield | grey |
| `trophy` | trophy | gold |

## Regenerate

```bash
node scripts/generate-emojis.js
```

This writes `generated/<name>.svg`, `generated/png/<name>.png` (128×128) and
`generated/manifest.json`. `generated/preview.png` is a contact sheet of the
whole set. Glyphs are in `icons/`; only add icons there if you
change the set.

## Upload

Discord does not accept SVG for emoji uploads — use the PNGs in `generated/png`
and name them after the file (e.g. `tick`). Uploading them in the same order as
the table keeps the set tidy.
