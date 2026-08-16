// Combines the built dist/*.build.js files + src/data.js + src/fallback-utils.js
// into a single self-contained standalone.html, using src/template.html as
// the HTML shell. Run `npm run build:standalone` (which runs build.sh then
// this script), not this file directly, unless dist/ already exists.
const fs = require("fs");
const path = __dirname;

const files = [
  "dist/react-globals.bundle.js",
  "src/data.js",
  "dist/ui.build.js",
  "dist/modules1.build.js",
  "dist/modules2.build.js",
  "dist/modules3.build.js",
  "dist/app.build.js",
  "src/fallback-utils.js",
];

let bundle = files.map(f => {
  let code = fs.readFileSync(path + "/" + f, "utf8");
  // The HTML tokenizer ends a <script> block at the raw byte sequence
  // "</script" even inside a JS string literal — minified libraries (e.g.
  // React DOM's escaping helpers) can contain that exact substring. Escape
  // it (and the opening form, defensively) so the whole file stays inside
  // one inline <script> element.
  code = code.split("</script").join("<\\/script").split("<script").join("<\\script");
  return `<script>\n/* ---- ${f} ---- */\n${code}\n</script>`;
}).join("\n");

const template = fs.readFileSync(path + "/src/template.html", "utf8");

// Replace the block of <script src="..."> tags with the inlined bundle.
// IMPORTANT: pass a replacer FUNCTION, not a string — String.replace()
// treats "$&", "$'", "$`", "$1" etc. specially in a string replacement,
// and minified JS reliably contains sequences like that by accident.
const out = template.replace(
  /<script src="\.\/react-globals\.bundle\.js"><\/script>[\s\S]*?<script src="\.\/fallback-utils\.js"><\/script>/,
  () => bundle
);

if (out === template) {
  console.error("WARNING: replacement did not match — output unchanged from template!");
  process.exit(1);
}

fs.writeFileSync(path + "/standalone.html", out);
console.log("Wrote standalone.html —", (fs.statSync(path + "/standalone.html").size / 1024).toFixed(0) + "KB");
