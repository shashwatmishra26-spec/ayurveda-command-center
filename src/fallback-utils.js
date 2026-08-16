/* =========================================================================
   Fallback utility-class engine.
   ---------------------------------------------------------------------
   This app is authored with Tailwind-style utility classes and normally
   styled by the Tailwind CDN script. In case that CDN is unreachable
   (offline demo, restricted network, etc.) this small engine walks the
   DOM and applies the same values as inline styles, so the layout stays
   usable even with zero external network access. It only sets base
   layout/spacing/typography — it does not attempt hover/focus states or
   responsive breakpoints, which require the real stylesheet.
   Runs only once Tailwind fails to load (see the check at the bottom).
   ========================================================================= */
(function () {
  "use strict";

  const SPACE = (n) => {
    if (n === "px") return "1px";
    const v = parseFloat(n);
    return (v * 0.25) + "rem";
  };
  const TEXT_SIZE = { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem" };
  const ROUNDED = { "": "0.25rem", none: "0px", sm: "0.125rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem", full: "9999px" };
  const SHADOW = {
    sm: "0 1px 2px 0 rgba(0,0,0,0.05)",
    md: "0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1)",
    lg: "0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)",
    xl: "0 20px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1)",
    "2xl": "0 25px 50px -12px rgba(0,0,0,0.25)",
  };
  const Z = { 0: "0", 10: "10", 20: "20", 30: "30", 40: "40", 50: "50" };

  function px(v) { return /^[\d.]+$/.test(v) ? v + "px" : v; }

  // static exact-match utilities
  const STATIC = {
    flex: { display: "flex" }, "inline-flex": { display: "inline-flex" }, block: { display: "block" },
    "inline-block": { display: "inline-block" }, grid: { display: "grid" }, hidden: { display: "none" }, table: { display: "table" },
    "flex-1": { flex: "1 1 0%" }, "flex-col": { flexDirection: "column" }, "flex-row": { flexDirection: "row" },
    "flex-wrap": { flexWrap: "wrap" }, "shrink-0": { flexShrink: "0" }, "grow": { flexGrow: "1" },
    "items-center": { alignItems: "center" }, "items-start": { alignItems: "flex-start" }, "items-end": { alignItems: "flex-end" },
    "justify-center": { justifyContent: "center" }, "justify-between": { justifyContent: "space-between" }, "justify-start": { justifyContent: "flex-start" }, "justify-end": { justifyContent: "flex-end" },
    "self-start": { alignSelf: "flex-start" },
    relative: { position: "relative" }, absolute: { position: "absolute" }, fixed: { position: "fixed" }, sticky: { position: "sticky" },
    "inset-0": { top: "0", right: "0", bottom: "0", left: "0" },
    "overflow-hidden": { overflow: "hidden" }, "overflow-y-auto": { overflowY: "auto" }, "overflow-x-auto": { overflowX: "auto" },
    truncate: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, "whitespace-nowrap": { whiteSpace: "nowrap" },
    "text-left": { textAlign: "left" }, "text-center": { textAlign: "center" }, "text-right": { textAlign: "right" },
    uppercase: { textTransform: "uppercase" }, lowercase: { textTransform: "lowercase" }, capitalize: { textTransform: "capitalize" },
    italic: { fontStyle: "italic" }, underline: { textDecoration: "underline" },
    "font-medium": { fontWeight: "500" }, "font-semibold": { fontWeight: "600" }, "font-bold": { fontWeight: "700" }, "font-normal": { fontWeight: "400" },
    "tracking-wide": { letterSpacing: "0.025em" }, "tracking-tight": { letterSpacing: "-0.025em" },
    "leading-none": { lineHeight: "1" }, "leading-tight": { lineHeight: "1.25" }, "leading-snug": { lineHeight: "1.375" }, "leading-relaxed": { lineHeight: "1.625" },
    "min-w-0": { minWidth: "0" }, "w-full": { width: "100%" }, "h-full": { height: "100%" }, "w-screen": { width: "100vw" }, "h-screen": { height: "100vh" },
    "rounded-full": { borderRadius: "9999px" }, border: { borderWidth: "1px", borderStyle: "solid" }, "border-2": { borderWidth: "2px", borderStyle: "solid" },
    "border-t": { borderTopWidth: "1px", borderStyle: "solid" }, "border-b": { borderBottomWidth: "1px", borderStyle: "solid" },
    "border-b-2": { borderBottomWidth: "2px", borderStyle: "solid" }, "border-l": { borderLeftWidth: "1px", borderStyle: "solid" },
    "cursor-pointer": { cursor: "pointer" }, "cursor-not-allowed": { cursor: "not-allowed" },
    "pointer-events-none": { pointerEvents: "none" }, "outline-none": { outline: "none" },
    "list-disc": { listStyleType: "disc" }, "mx-auto": { marginLeft: "auto", marginRight: "auto" },
    "transition-all": { transition: "all .15s ease" }, "transition-colors": { transition: "color .15s ease,background-color .15s ease,border-color .15s ease" }, "transition-shadow": { transition: "box-shadow .15s ease" },
    "rotate-180": { transform: "rotate(180deg)" }, "rotate-90": { transform: "rotate(90deg)" },
    "bg-white": { backgroundColor: "#fff" }, "bg-transparent": { backgroundColor: "transparent" }, "text-white": { color: "#fff" },
    tabular: { fontVariantNumeric: "tabular-nums" },
  };

  function applyDecl(el, decl) { Object.assign(el.style, decl); }

  function handleToken(el, tok) {
    if (STATIC[tok]) { applyDecl(el, STATIC[tok]); return; }
    let m;
    if ((m = tok.match(/^grid-cols-(\d+)$/))) { el.style.display = el.style.display || "grid"; el.style.gridTemplateColumns = `repeat(${m[1]},minmax(0,1fr))`; return; }
    if ((m = tok.match(/^col-span-(\d+)$/))) { el.style.gridColumn = `span ${m[1]} / span ${m[1]}`; return; }
    if ((m = tok.match(/^(gap|gap-x|gap-y)-([\d.]+|px)$/))) { const v = SPACE(m[2]); if (m[1] === "gap") el.style.gap = v; else if (m[1] === "gap-x") el.style.columnGap = v; else el.style.rowGap = v; return; }
    if ((m = tok.match(/^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-(-?[\d.]+|px)$/))) {
      const neg = m[2].startsWith("-");
      const val = SPACE(m[2].replace("-", ""));
      const v = neg ? "-" + val : val;
      const map = { p: ["padding"], px: ["paddingLeft", "paddingRight"], py: ["paddingTop", "paddingBottom"], pt: ["paddingTop"], pb: ["paddingBottom"], pl: ["paddingLeft"], pr: ["paddingRight"], m: ["margin"], mx: ["marginLeft", "marginRight"], my: ["marginTop", "marginBottom"], mt: ["marginTop"], mb: ["marginBottom"], ml: ["marginLeft"], mr: ["marginRight"] };
      (map[m[1]] || []).forEach(p => el.style[p] = v);
      return;
    }
    if ((m = tok.match(/^-(m[trblxy]?)-(-?[\d.]+|px)$/))) { const val = "-" + SPACE(m[2]); const map = { m: ["margin"], mx: ["marginLeft", "marginRight"], my: ["marginTop", "marginBottom"], mt: ["marginTop"], mb: ["marginBottom"], ml: ["marginLeft"], mr: ["marginRight"] }; (map[m[1]] || []).forEach(p => el.style[p] = val); return; }
    if ((m = tok.match(/^(w|h|max-w|max-h|min-w|min-h)-\[(.+)\]$/))) { const prop = { w: "width", h: "height", "max-w": "maxWidth", "max-h": "maxHeight", "min-w": "minWidth", "min-h": "minHeight" }[m[1]]; el.style[prop] = m[2]; return; }
    if ((m = tok.match(/^(w|h)-([\d.]+|px|full|screen)$/))) { const prop = m[1] === "w" ? "width" : "height"; el.style[prop] = m[2] === "full" ? "100%" : m[2] === "screen" ? (m[1] === "w" ? "100vw" : "100vh") : SPACE(m[2]); return; }
    if ((m = tok.match(/^(top|left|right|bottom)-\[(.+)\]$/))) { el.style[m[1]] = m[2]; return; }
    if ((m = tok.match(/^(top|left|right|bottom)-(-?[\d.]+|px|full)$/))) { el.style[m[1]] = m[2] === "full" ? "100%" : SPACE(m[2]); return; }
    if ((m = tok.match(/^-(top|left|right|bottom)-([\d.]+|px)$/))) { el.style[m[1]] = "-" + SPACE(m[2]); return; }
    if ((m = tok.match(/^z-(\d+)$/))) { el.style.zIndex = Z[m[1]] || m[1]; return; }
    if ((m = tok.match(/^text-\[(.+)\]$/))) { const v = m[1]; if (v.startsWith("var(") || v.startsWith("#")) el.style.color = v; else el.style.fontSize = v; return; }
    if ((m = tok.match(/^text-(xs|sm|base|lg|xl|2xl|3xl)$/))) { el.style.fontSize = TEXT_SIZE[m[1]]; return; }
    if ((m = tok.match(/^(bg|border|text)-\[var\((--[\w-]+)\)\]$/))) { const prop = { bg: "backgroundColor", border: "borderColor", text: "color" }[m[1]]; el.style[prop] = `var(${m[2]})`; return; }
    if ((m = tok.match(/^(bg|border|text)-\[(#[0-9a-fA-F]{3,8})\]$/))) { const prop = { bg: "backgroundColor", border: "borderColor", text: "color" }[m[1]]; el.style[prop] = m[2]; return; }
    if ((m = tok.match(/^(bg|border|text)-white\/(\d+)$/))) { const prop = { bg: "backgroundColor", border: "borderColor", text: "color" }[m[1]]; el.style[prop] = `rgba(255,255,255,${(+m[2]) / 100})`; return; }
    if ((m = tok.match(/^rounded(?:-(none|sm|md|lg|xl|2xl|3xl|full|t-2xl|b-2xl|tl-sm|tr-sm))?$/))) {
      const key = m[1] || "";
      if (key === "t-2xl") { el.style.borderTopLeftRadius = el.style.borderTopRightRadius = ROUNDED["2xl"]; return; }
      if (key === "b-2xl") { el.style.borderBottomLeftRadius = el.style.borderBottomRightRadius = ROUNDED["2xl"]; return; }
      if (key === "tl-sm") { el.style.borderTopLeftRadius = ROUNDED.sm; return; }
      if (key === "tr-sm") { el.style.borderTopRightRadius = ROUNDED.sm; return; }
      el.style.borderRadius = ROUNDED[key] !== undefined ? ROUNDED[key] : ROUNDED[""];
      return;
    }
    if ((m = tok.match(/^shadow(?:-(sm|md|lg|xl|2xl))?$/))) { el.style.boxShadow = SHADOW[m[1] || "md"]; return; }
    if ((m = tok.match(/^max-w-(xs|sm|md|lg|xl|2xl)$/))) { const scale = { xs: "20rem", sm: "24rem", md: "28rem", lg: "32rem", xl: "36rem", "2xl": "42rem" }; el.style.maxWidth = scale[m[1]]; return; }
  }

  function process(root) {
    const els = root.querySelectorAll ? Array.from(root.querySelectorAll("[class]")) : [];
    if (root.nodeType === 1 && root.hasAttribute && root.hasAttribute("class")) els.unshift(root);
    els.forEach(el => {
      const cls = el.getAttribute("class");
      if (!cls) return;
      cls.split(/\s+/).forEach(tokRaw => {
        if (!tokRaw) return;
        // strip responsive/state prefixes we can't emulate; apply base token only
        const parts = tokRaw.split(":");
        const base = parts[parts.length - 1];
        if (parts.length > 1) return; // skip hover:/sm:/focus: etc — needs real CSS
        handleToken(el, base);
      });
    });
  }

  function boot() {
    process(document);
    const root = document.getElementById("root");
    if (root && window.MutationObserver) {
      const obs = new MutationObserver((muts) => {
        muts.forEach(mu => mu.addedNodes && mu.addedNodes.forEach(n => { if (n.nodeType === 1) process(n); }));
      });
      obs.observe(root, { childList: true, subtree: true });
    }
  }

  function tailwindActive() {
    // Real, reliable test: does a live element with class="flex" actually
    // compute to display:flex? This is true only if Tailwind's generated
    // stylesheet is present and active, regardless of how it got there.
    const probe = document.createElement("div");
    probe.className = "flex";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    document.body.appendChild(probe);
    const isFlex = getComputedStyle(probe).display === "flex";
    document.body.removeChild(probe);
    return isFlex;
  }

  // Give the Tailwind CDN script a brief window to load & run; if the probe
  // shows it never activated, engage the fallback engine so the layout stays
  // usable offline. If Tailwind IS active, do nothing — never fight its
  // responsive / hover rules with inline styles.
  let engaged = false;
  function maybeEngage() {
    if (engaged || tailwindActive()) return;
    engaged = true;
    boot();
    console.info("[Ayurveda Command Center] Tailwind CDN not detected — fallback layout engine engaged.");
  }
  window.addEventListener("load", () => setTimeout(maybeEngage, 900));
  document.addEventListener("DOMContentLoaded", () => setTimeout(maybeEngage, 1400));
})();
