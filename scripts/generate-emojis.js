/**
 * Generates the bot's emoji set.
 *
 * Each emoji is the shared decagon shape from assets/emojis/shape.svg filled
 * with a top-to-bottom gradient (lighter at the top, base color at the bottom),
 * with a white glyph centered on top. Glyphs live in assets/emojis/icons.
 *
 * Writes assets/emojis/generated/<name>.svg and, when rsvg-convert is
 * available, assets/emojis/generated/png/<name>.png (128x128, what Discord
 * actually accepts for emoji uploads).
 *
 * Usage: node scripts/generate-emojis.js
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SHAPE = path.join(ROOT, "assets/emojis/shape.svg");
const ICONS = path.join(ROOT, "assets/emojis/icons");
const OUT = path.join(ROOT, "assets/emojis/generated");
const PNG = path.join(OUT, "png");

// name -> [raw icon, base color]
const EMOJIS = {
    tick: ["Check", "#57F287"],
    cross: ["Close", "#ED4245"],
    warn: ["Exclamation", "#FEE75C"],
    info: ["Information", "#5865F2"],
    staff: ["ShieldStar", "#7C5CFC"],
    ticket: ["Ticket", "#9B59B6"],
    idea: ["Speech3", "#5865F2"],
    upvote: ["ThumbsUp", "#57F287"],
    downvote: ["ThumbsDown", "#ED4245"],
    star: ["Star", "#F1C40F"],
    pin: ["Pin", "#E67E22"],
    clock: ["Time", "#3498DB"],
    link: ["Link", "#1ABC9C"],
    announce: ["Announcement2", "#7289DA"],
    boost: ["Boost10", "#FF73FA"],
    gift: ["Gift", "#EB459E"],
    event: ["Event", "#B57BFF"],
    welcome: ["Sparkles", "#57F287"],
    rules: ["Shield2", "#7F8C8D"],
    trophy: ["Trophy", "#F1C40F"]
};

const hexToRgb = (hex) => {
    const value = parseInt(hex.replace("#", ""), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHex = (rgb) =>
    "#" +
    rgb
        .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
        .join("");

const mix = (hex, target, amount) => {
    const a = hexToRgb(hex);
    const b = hexToRgb(target);
    return rgbToHex(a.map((channel, i) => channel + (b[i] - channel) * amount));
};

const lighten = (hex, amount) => mix(hex, "#ffffff", amount);

/** Block out the outer <svg> wrapper and keep its viewBox + inner markup. */
const readIcon = (file) => {
    const source = fs.readFileSync(path.join(ICONS, `${file}.svg`), "utf8");
    const root = source.match(/<svg[^>]*>/i);
    const viewBox = root?.[0].match(/viewBox="([^"]+)"/i)?.[1];
    if (!root || !viewBox) throw new Error(`No viewBox in ${file}.svg`);

    const [x, y, width, height] = viewBox
        .trim()
        .split(/[\s,]+/)
        .map(Number);

    let inner = source
        .slice(source.indexOf(root[0]) + root[0].length)
        .replace(/<\/svg>\s*$/i, "")
        .replace(/currentColor/g, "#ffffff")
        // every glyph must read as a solid white mark
        .replace(/fill="(?!none")[^"]*"/gi, 'fill="#ffffff"')
        .replace(/stroke="(?!none")[^"]*"/gi, 'stroke="#ffffff"')
        .replace(/\sclass="[^"]*"/gi, "");

    return { inner: inner.trim(), x, y, width, height };
};

const shape = fs.readFileSync(SHAPE, "utf8");
const shapePath = shape.match(/<path[^>]*\sd="([^"]+)"/i)?.[1];
if (!shapePath) throw new Error("Could not find the decagon path in shape.svg");

// The decagon is 302x286; center it in a square canvas so PNGs aren't squashed.
const SIZE = 302;
const OFFSET_Y = (SIZE - 286) / 2;
const CENTER = SIZE / 2;
const GLYPH_BOX = 136;

fs.mkdirSync(PNG, { recursive: true });

const manifest = [];
for (const [name, [iconName, base]] of Object.entries(EMOJIS)) {
    const icon = readIcon(iconName);
    const scale = GLYPH_BOX / Math.max(icon.width, icon.height);
    const translateX = CENTER - (icon.width * scale) / 2 - icon.x * scale;
    const translateY = CENTER - (icon.height * scale) / 2 - icon.y * scale;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 ${SIZE} ${SIZE}" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${lighten(base, 0.3)}"/>
      <stop offset="100%" stop-color="${base}"/>
    </linearGradient>
  </defs>
  <g transform="translate(0, ${OFFSET_Y})">
    <path d="${shapePath}" fill="url(#bg)"/>
  </g>
  <g transform="translate(${translateX.toFixed(2)}, ${translateY.toFixed(2)}) scale(${scale.toFixed(4)})" fill="#ffffff">
    ${icon.inner}
  </g>
</svg>
`;

    fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
    manifest.push({ name, icon: iconName, color: base });

    try {
        execFileSync("rsvg-convert", [
            "-w",
            "128",
            "-h",
            "128",
            "-o",
            path.join(PNG, `${name}.png`),
            path.join(OUT, `${name}.svg`)
        ]);
    } catch {
        // PNGs are optional; SVGs are the source of truth.
    }
}

fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
);

console.log(`Generated ${manifest.length} emojis in ${path.relative(ROOT, OUT)}`);
