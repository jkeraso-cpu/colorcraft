import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Bookmark,
  Check,
  CheckCircle2,
  Clipboard,
  Code2,
  Copy,
  Download,
  Eye,
  FileJson,
  ImageDown,
  Import,
  Keyboard,
  Layers3,
  Moon,
  Palette,
  Redo2,
  Save,
  Shuffle,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  X,
  XCircle,
} from "lucide-react";
import { colorMath } from "./colorMath";
import { harmony, type HarmonyMode } from "./harmony";
import { paletteExport } from "./paletteExport";
import { paletteUtils, type Roles } from "./paletteUtils";
import { storage, type SavedPalette, type ThemeMode } from "./storage";
import { Swatch } from "./Swatch";

const initialPalette = ["#2563EB", "#60A5FA", "#A78BFA", "#F8FAFC", "#0F172A"];

const harmonyLabels: Record<HarmonyMode, string> = {
  random: "Random",
  complementary: "Complementary",
  analogous: "Analogous",
  triadic: "Triadic",
  split: "Split complement",
  monochromatic: "Monochromatic",
  tetradic: "Tetradic",
};

type RoleName = keyof Roles;
const roleLabels: Record<RoleName, string> = {
  background: "Background",
  surface: "Surface",
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  text: "Text",
};

type ExportType = "hex" | "css" | "tailwind" | "json";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function applyTheme(mode: ThemeMode) {
  const dark = mode === "dark" || (mode === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function App() {
  const [palette, setPalette] = useState(initialPalette);
  const [locked, setLocked] = useState(initialPalette.map(() => false));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<HarmonyMode>("random");
  const [baseColor, setBaseColor] = useState("#2563EB");
  const [paletteName, setPaletteName] = useState(() => paletteUtils.name(initialPalette));
  const [roles, setRoles] = useState<Roles>(() => paletteUtils.autoRoles(initialPalette));
  const [past, setPast] = useState<string[][]>([]);
  const [future, setFuture] = useState<string[][]>([]);
  const [saved, setSaved] = useState<SavedPalette[]>(() => storage.loadPalettes());
  const [theme, setTheme] = useState<ThemeMode>(() => storage.loadTheme());
  const [copied, setCopied] = useState("");
  const [toast, setToast] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInput, setEditorInput] = useState(initialPalette[0]);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SavedPalette | null>(null);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [foregroundIndex, setForegroundIndex] = useState(4);
  const [backgroundIndex, setBackgroundIndex] = useState(3);
  const [previewType, setPreviewType] = useState<"website" | "dashboard" | "mobile">("website");
  const [exportType, setExportType] = useState<ExportType>("hex");
  const [branding, setBranding] = useState(true);

  const createRef = useRef<HTMLElement>(null);
  const contrastRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const savedRef = useRef<HTMLElement>(null);

  useEffect(() => {
    storage.savePalettes(saved);
  }, [saved]);

  useEffect(() => {
    applyTheme(theme);
    storage.saveTheme(theme);
    if (theme !== "auto") return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("auto");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setForegroundIndex((index) => Math.min(index, palette.length - 1));
    setBackgroundIndex((index) => Math.min(index, palette.length - 1));
  }, [palette.length]);

  const selectedColor = palette[selectedIndex] ?? palette[0];
  const selectedRgb = colorMath.hexToRgb(selectedColor)!;
  const selectedHsl = colorMath.hexToHsl(selectedColor)!;
  const contrastForeground = palette[foregroundIndex] ?? palette[0];
  const contrastBackground = palette[backgroundIndex] ?? palette[palette.length - 1];
  const ratio = colorMath.contrastRatio(contrastForeground, contrastBackground);
  const ratings = colorMath.wcagRating(ratio);
  const previewRatio = colorMath.contrastRatio(roles.text, roles.background);

  const readablePairs = useMemo(() => {
    const pairs: Array<{ foreground: string; background: string; ratio: number; fg: number; bg: number }> = [];
    palette.forEach((foreground, fg) => {
      palette.forEach((background, bg) => {
        if (fg === bg) return;
        const pairRatio = colorMath.contrastRatio(foreground, background);
        if (pairRatio >= 4.5) pairs.push({ foreground, background, ratio: pairRatio, fg, bg });
      });
    });
    return pairs.sort((a, b) => b.ratio - a.ratio).slice(0, 6);
  }, [palette]);

  const exportContent = useMemo(() => {
    if (exportType === "css") return paletteExport.css(palette, roles);
    if (exportType === "tailwind") return paletteExport.tailwind(roles);
    if (exportType === "json") return paletteExport.json(paletteName, palette, mode, roles);
    return paletteExport.hex(palette);
  }, [exportType, palette, roles, paletteName, mode]);

  function notify(message: string) {
    setToast(message);
  }

  function record(next: string[], keepName = false) {
    setPast((history) => [...history, palette].slice(-10));
    setFuture([]);
    setPalette(next);
    setLocked((current) => next.map((_, index) => current[index] ?? false));
    setSelectedIndex((index) => Math.min(index, next.length - 1));
    setRoles(paletteUtils.autoRoles(next));
    if (!keepName) setPaletteName(paletteUtils.name(next));
  }

  function generate(source = baseColor, harmonyMode = mode) {
    const generated = harmony.generate(source, harmonyMode, palette.length);
    const next = generated.map((color, index) => locked[index] ? palette[index] : color);
    record(next);
  }

  function changeSize(size: number) {
    if (size === palette.length) return;
    if (size < palette.length) {
      record(palette.slice(0, size));
      setLocked((current) => current.slice(0, size));
      return;
    }
    const generated = harmony.generate(baseColor, mode, size);
    record(Array.from({ length: size }, (_, index) => palette[index] ?? generated[index]));
  }

  function undo() {
    const previous = past[past.length - 1];
    if (!previous) return;
    setFuture((items) => [palette, ...items].slice(0, 10));
    setPast((items) => items.slice(0, -1));
    setPalette(previous);
    setLocked(previous.map((_, index) => locked[index] ?? false));
    setRoles(paletteUtils.autoRoles(previous));
    setSelectedIndex((index) => Math.min(index, previous.length - 1));
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setPast((items) => [...items, palette].slice(-10));
    setFuture((items) => items.slice(1));
    setPalette(next);
    setLocked(next.map((_, index) => locked[index] ?? false));
    setRoles(paletteUtils.autoRoles(next));
    setSelectedIndex((index) => Math.min(index, next.length - 1));
  }

  function moveColor(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= palette.length) return;
    const next = [...palette];
    [next[index], next[target]] = [next[target], next[index]];
    const nextLocked = [...locked];
    [nextLocked[index], nextLocked[target]] = [nextLocked[target], nextLocked[index]];
    setPast((items) => [...items, palette].slice(-10));
    setFuture([]);
    setPalette(next);
    setLocked(nextLocked);
    setSelectedIndex(target);
  }

  function toggleLock(index: number) {
    setLocked((current) => current.map((value, i) => i === index ? !value : value));
  }

  async function copyText(text: string, label = "Copied") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      notify(label);
      window.setTimeout(() => setCopied((current) => current === text ? "" : current), 1500);
    } catch {
      notify("Clipboard access isn't available");
    }
  }

  function openEditor(index: number) {
    setSelectedIndex(index);
    setEditorInput(palette[index]);
    setEditorOpen(true);
  }

  function saveEditedColor() {
    const normalized = colorMath.normalizeHex(editorInput);
    if (!normalized) return;
    record(palette.map((color, index) => index === selectedIndex ? normalized : color), true);
    setEditorOpen(false);
    notify("Color updated");
  }

  function savePalette() {
    const item: SavedPalette = {
      id: crypto.randomUUID(),
      name: paletteName.trim() || paletteUtils.name(palette),
      colors: [...palette],
      harmony: mode,
      createdAt: new Date().toISOString(),
    };
    setSaved((current) => [item, ...current]);
    notify("Palette saved");
  }

  function openSaved(item: SavedPalette) {
    record(item.colors, true);
    if (Object.keys(harmonyLabels).includes(item.harmony)) setMode(item.harmony as HarmonyMode);
    setPaletteName(item.name);
    createRef.current?.scrollIntoView({ behavior: "smooth" });
    notify("Palette opened");
  }

  function applyImport() {
    const parsed = paletteUtils.parseImport(importText);
    if (parsed.error) {
      setImportError(parsed.error);
      return;
    }
    record(parsed.colors);
    setLocked(parsed.colors.map(() => false));
    setImportText("");
    setImportError("");
    setImportOpen(false);
    notify("Palette imported");
  }

  function suggestText() {
    const candidates = ["#111827", "#FFFFFF", ...palette];
    const best = candidates
      .map((color) => ({ color, ratio: colorMath.contrastRatio(color, roles.background) }))
      .sort((a, b) => b.ratio - a.ratio)[0];
    if (best) setRoles((current) => ({ ...current, text: best.color }));
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;
      if (event.code === "Space") {
        event.preventDefault();
        generate();
      } else if (event.key.toLowerCase() === "l") {
        toggleLock(selectedIndex);
      } else if (event.key.toLowerCase() === "c") {
        copyText(selectedColor, "HEX copied");
      } else if (event.key.toLowerCase() === "z" && event.shiftKey) {
        redo();
      } else if (event.key.toLowerCase() === "z") {
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const editorHex = colorMath.normalizeHex(editorInput);
  const editorRgb = colorMath.hexToRgb(editorHex ?? selectedColor)!;
  const editorHsl = colorMath.hexToHsl(editorHex ?? selectedColor)!;

  function updateEditorRgb(channel: "r" | "g" | "b", value: number) {
    const rgb = colorMath.hexToRgb(editorHex ?? selectedColor)!;
    setEditorInput(colorMath.rgbToHex(
      channel === "r" ? clamp(value, 0, 255) : rgb.r,
      channel === "g" ? clamp(value, 0, 255) : rgb.g,
      channel === "b" ? clamp(value, 0, 255) : rgb.b,
    ));
  }

  function updateEditorHsl(channel: "h" | "s" | "l", value: number) {
    const hsl = colorMath.hexToHsl(editorHex ?? selectedColor)!;
    setEditorInput(colorMath.hslToHex(
      channel === "h" ? clamp(value, 0, 360) : hsl.h,
      channel === "s" ? clamp(value, 0, 100) : hsl.s,
      channel === "l" ? clamp(value, 0, 100) : hsl.l,
    ));
  }

  function roleSelect(role: RoleName) {
    return (
      <label className="role-row" key={role}>
        <span>{roleLabels[role]}</span>
        <select
          value={Math.max(0, palette.indexOf(roles[role]))}
          onChange={(event) => setRoles((current) => ({ ...current, [role]: palette[Number(event.target.value)] }))}
        >
          {palette.map((color, index) => (
            <option key={`${role}-${index}`} value={index}>{color}</option>
          ))}
        </select>
      </label>
    );
  }

  const nextTheme: Record<ThemeMode, ThemeMode> = { auto: "light", light: "dark", dark: "auto" };

  return (
    <main className="app">
      <header className="topbar">
        <button className="brand" onClick={() => createRef.current?.scrollIntoView({ behavior: "smooth" })}>
          <span className="logo-mark"><i /><i /><i /></span>
          <span><strong>ColorCraft</strong><small>Build palettes that actually work.</small></span>
        </button>

        <nav>
          <button onClick={() => createRef.current?.scrollIntoView({ behavior: "smooth" })}>Create</button>
          <button onClick={() => contrastRef.current?.scrollIntoView({ behavior: "smooth" })}>Contrast</button>
          <button onClick={() => previewRef.current?.scrollIntoView({ behavior: "smooth" })}>Preview</button>
          <button onClick={() => savedRef.current?.scrollIntoView({ behavior: "smooth" })}>Saved</button>
        </nav>

        <div className="top-actions">
          <button className="icon-button" onClick={() => setShortcutOpen(true)} aria-label="Keyboard shortcuts">
            <Keyboard size={18} />
          </button>
          <button className="icon-button theme-button" onClick={() => setTheme(nextTheme[theme])} aria-label={`Theme: ${theme}`}>
            {theme === "dark" ? <Moon size={18} /> : theme === "light" ? <Sun size={18} /> : <Sparkles size={18} />}
          </button>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="kicker">Color toolkit</p>
          <h1>Build palettes that actually work.</h1>
          <p>Generate, test, preview, save, and export color combinations for real interfaces.</p>
        </div>
        <div className="intro-actions">
          <button className="button primary" onClick={() => createRef.current?.scrollIntoView({ behavior: "smooth" })}><Palette size={18} /> Create palette</button>
          <button className="button outline" onClick={() => contrastRef.current?.scrollIntoView({ behavior: "smooth" })}><Eye size={18} /> Check contrast</button>
        </div>
      </section>

      <section className="studio" ref={createRef}>
        <div className="section-head compact">
          <div><p className="kicker">Palette studio</p><h2>Shape the color system.</h2></div>
          <div className="button-row">
            <button className="button ghost" disabled={!past.length} onClick={undo}><Undo2 size={16} /> Undo</button>
            <button className="button ghost" disabled={!future.length} onClick={redo}><Redo2 size={16} /> Redo</button>
            <button className="button outline" onClick={() => setImportOpen(true)}><Import size={16} /> Import</button>
            <button className="button outline" onClick={savePalette}><Save size={16} /> Save</button>
            <button className="button primary" onClick={() => generate()}><Shuffle size={17} /> Generate</button>
          </div>
        </div>

        <div className="control-deck">
          <div className="control-block">
            <span>Harmony</span>
            <div className="harmony-buttons">
              {(Object.keys(harmonyLabels) as HarmonyMode[]).map((item) => (
                <button
                  key={item}
                  className={`chip ${mode === item ? "active" : ""}`}
                  onClick={() => setMode(item)}
                >
                  {harmonyLabels[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="control-block">
            <span>Build from color</span>
            <div className="base-row">
              <input type="color" value={colorMath.normalizeHex(baseColor) ?? "#2563EB"} onChange={(event) => setBaseColor(event.target.value.toUpperCase())} />
              <input className="mono" value={baseColor} onChange={(event) => setBaseColor(event.target.value)} />
              <button className="button secondary" onClick={() => {
                const normalized = colorMath.normalizeHex(baseColor);
                if (!normalized) return notify("Enter a valid HEX color");
                setBaseColor(normalized);
                generate(normalized, mode);
              }}>Build</button>
            </div>
          </div>

          <div className="control-block">
            <span>Palette size</span>
            <select value={palette.length} onChange={(event) => changeSize(Number(event.target.value))}>
              {[3,4,5,6,7,8].map((size) => <option key={size} value={size}>{size} colors</option>)}
            </select>
          </div>
        </div>

        <div className="palette-strip">
          {palette.map((color, index) => (
            <Swatch
              key={`${index}-${color}`}
              color={color}
              index={index}
              locked={locked[index]}
              selected={selectedIndex === index}
              copied={copied === color}
              onSelect={() => setSelectedIndex(index)}
              onToggleLock={() => toggleLock(index)}
              onCopy={() => copyText(color, "HEX copied")}
              onEdit={() => openEditor(index)}
              onMove={(direction) => moveColor(index, direction)}
            />
          ))}
        </div>

        <div className="inspector">
          <div className="inspector-head">
            <div className="inspector-title">
              <span className="color-chip" style={{ background: selectedColor }} />
              <div><p className="kicker">Color inspector</p><h3>{colorMath.approximateName(selectedColor)}</h3></div>
            </div>
            <button className="button outline" onClick={() => openEditor(selectedIndex)}>Edit selected color</button>
          </div>

          <div className="inspect-grid">
            {[
              ["HEX", selectedColor],
              ["RGB", `rgb(${selectedRgb.r}, ${selectedRgb.g}, ${selectedRgb.b})`],
              ["HSL", `hsl(${Math.round(selectedHsl.h)}, ${Math.round(selectedHsl.s)}%, ${Math.round(selectedHsl.l)}%)`],
              ["Hue", `${Math.round(selectedHsl.h)}°`],
              ["Saturation", `${Math.round(selectedHsl.s)}%`],
              ["Lightness", `${Math.round(selectedHsl.l)}%`],
              ["Luminance", colorMath.relativeLuminance(selectedColor).toFixed(4)],
              ["Approx. name", colorMath.approximateName(selectedColor)],
            ].map(([label, value]) => (
              <button key={label} onClick={() => copyText(value, `${label} copied`)}>
                <span>{label}</span><strong>{value}</strong><Copy size={14} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section" ref={contrastRef}>
        <div className="section-head">
          <div><p className="kicker">Contrast checker</p><h2>Readable is part of beautiful.</h2></div>
          <p>WCAG contrast math, applied directly to the palette you’re building.</p>
        </div>

        <div className="two-column contrast-layout">
          <div className="panel">
            <div className="contrast-controls">
              <label><span>Foreground</span><select value={foregroundIndex} onChange={(event) => setForegroundIndex(Number(event.target.value))}>
                {palette.map((color,index) => <option key={`fg-${index}`} value={index}>{color}</option>)}
              </select></label>

              <button className="button ghost" onClick={() => {
                setForegroundIndex(backgroundIndex);
                setBackgroundIndex(foregroundIndex);
              }}><ArrowLeftRight size={16} /> Swap</button>

              <label><span>Background</span><select value={backgroundIndex} onChange={(event) => setBackgroundIndex(Number(event.target.value))}>
                {palette.map((color,index) => <option key={`bg-${index}`} value={index}>{color}</option>)}
              </select></label>
            </div>

            <div className="ratio-row">
              <div><strong>{ratio.toFixed(2)}:1</strong><span>Contrast ratio</span></div>
              <div className="ratings">
                {[
                  ["AA normal", ratings.normalAA],
                  ["AAA normal", ratings.normalAAA],
                  ["AA large", ratings.largeAA],
                  ["AAA large", ratings.largeAAA],
                ].map(([label, pass]) => (
                  <div className={pass ? "pass" : "fail"} key={String(label)}>
                    {pass ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    <span>{label}</span><strong>{pass ? "Pass" : "Fail"}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="contrast-preview" style={{ color: contrastForeground, background: contrastBackground }}>
              <span>Live readability preview</span>
              <h3>Design should stay readable.</h3>
              <p>Good color choices should work for actual content, not only swatches.</p>
              <button style={{ background: contrastForeground, color: contrastBackground }}>Primary action</button>
            </div>
          </div>

          <aside className="panel pairs">
            <p className="kicker">Find readable pairs</p>
            <h3>Strongest AA combinations</h3>
            {readablePairs.length ? readablePairs.map((pair) => (
              <button className="pair" key={`${pair.fg}-${pair.bg}`} onClick={() => {
                setForegroundIndex(pair.fg);
                setBackgroundIndex(pair.bg);
              }}>
                <span className="pair-sample" style={{ color: pair.foreground, background: pair.background }}>Aa</span>
                <span><strong>{pair.ratio.toFixed(2)}:1</strong><small>{pair.foreground} on {pair.background}</small></span>
              </button>
            )) : <p className="muted">No pair currently reaches AA normal-text contrast.</p>}
          </aside>
        </div>
      </section>

      <section className="section" ref={previewRef}>
        <div className="section-head">
          <div><p className="kicker">UI preview</p><h2>See the palette doing actual work.</h2></div>
          <button className="button outline" onClick={() => setRoles(paletteUtils.autoRoles(palette))}><Sparkles size={16} /> Auto assign</button>
        </div>

        <div className="preview-layout">
          <aside className="panel roles-panel">
            <h3>Color roles</h3>
            <p>Map palette colors to interface jobs.</p>
            <div className="role-list">
              {(Object.keys(roleLabels) as RoleName[]).map(roleSelect)}
            </div>

            {previewRatio < 4.5 && (
              <div className="warning">
                <strong>This pairing may be difficult to read.</strong>
                <span>{previewRatio.toFixed(2)}:1 between Text and Background.</span>
                <button className="button outline small" onClick={suggestText}>Suggest better text color</button>
              </div>
            )}
          </aside>

          <div className="panel preview-panel">
            <div className="tabs">
              {(["website","dashboard","mobile"] as const).map((type) => (
                <button key={type} className={previewType === type ? "active" : ""} onClick={() => setPreviewType(type)}>
                  {type === "website" ? "Website" : type === "dashboard" ? "Dashboard card" : "Mobile app card"}
                </button>
              ))}
            </div>

            {previewType === "website" && (
              <div className="website-mock" style={{ background: roles.background, color: roles.text }}>
                <nav style={{ background: roles.surface }}>
                  <strong>Northstar</strong><span>Product · About · Journal</span>
                  <button style={{ background: roles.primary, color: colorMath.readableTextColor(roles.primary) }}>Get started</button>
                </nav>
                <div className="mock-hero">
                  <span style={{ color: roles.accent }}>DESIGN SYSTEM</span>
                  <h3>Build something clear, useful, and memorable.</h3>
                  <p>A realistic interface shows whether a palette has enough separation and usable emphasis.</p>
                  <div>
                    <button style={{ background: roles.primary, color: colorMath.readableTextColor(roles.primary) }}>Primary action</button>
                    <button style={{ background: roles.secondary, color: colorMath.readableTextColor(roles.secondary) }}>Secondary</button>
                  </div>
                </div>
                <article style={{ background: roles.surface }}>
                  <span style={{ background: roles.accent, color: colorMath.readableTextColor(roles.accent) }}>New</span>
                  <strong>Surface card</strong>
                  <p>Buttons, text, cards, and badges reveal different color relationships.</p>
                </article>
              </div>
            )}

            {previewType === "dashboard" && (
              <div className="dashboard-mock" style={{ background: roles.background, color: roles.text }}>
                <aside style={{ background: roles.text }}><i style={{ background: roles.primary }} /><i /><i /><i /></aside>
                <div>
                  <header><strong>Workspace</strong><button style={{ background: roles.primary, color: colorMath.readableTextColor(roles.primary) }}>New report</button></header>
                  <section>
                    {[["Revenue","18.4k"],["Projects","24"],["Quality","98%"]].map(([label,value],index) => (
                      <article key={label} style={{ background: roles.surface }}>
                        <span>{label}</span><strong>{value}</strong>
                        <i style={{ background: index === 1 ? roles.accent : roles.primary }} />
                      </article>
                    ))}
                  </section>
                  <div className="chart" style={{ background: roles.surface }}>
                    {[42,70,55,86,62,92].map((height,index) => <i key={index} style={{ height: `${height}%`, background: index % 2 ? roles.accent : roles.primary }} />)}
                  </div>
                </div>
              </div>
            )}

            {previewType === "mobile" && (
              <div className="mobile-shell" style={{ background: roles.background, color: roles.text }}>
                <div className="mobile-mock">
                  <header><span>9:41</span><span>•••</span></header>
                  <p>Good morning</p>
                  <h3>Your week at a glance.</h3>
                  <article style={{ background: roles.surface }}>
                    <span style={{ color: roles.accent }}>FOCUS</span>
                    <strong>Finish the thing that matters most.</strong>
                    <button style={{ background: roles.primary, color: colorMath.readableTextColor(roles.primary) }}>Start session</button>
                  </article>
                  <div className="tag-row">
                    <span style={{ background: roles.secondary, color: colorMath.readableTextColor(roles.secondary) }}>Planning</span>
                    <span style={{ background: roles.accent, color: colorMath.readableTextColor(roles.accent) }}>Creative</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section" ref={savedRef}>
        <div className="section-head">
          <div><p className="kicker">Saved palettes</p><h2>Keep the combinations worth revisiting.</h2></div>
          <button className="button primary" onClick={savePalette}><Bookmark size={16} /> Save current palette</button>
        </div>

        {saved.length ? (
          <div className="saved-list">
            {saved.map((item) => (
              <article className="saved-card" key={item.id}>
                <div className="saved-strip">{item.colors.map((color,index) => <span key={index} style={{ background: color }} />)}</div>
                <div>
                  <input value={item.name} onChange={(event) => setSaved((current) => current.map((savedItem) => savedItem.id === item.id ? { ...savedItem, name: event.target.value } : savedItem))} />
                  <small>{new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(new Date(item.createdAt))} · {item.harmony}</small>
                </div>
                <div className="saved-actions">
                  <button className="button primary small" onClick={() => openSaved(item)}>Open</button>
                  <button className="button outline small" onClick={() => copyText(item.colors.join("\n"), "Palette copied")}><Copy size={14} /> Copy</button>
                  <button className="button outline small" onClick={() => paletteExport.downloadPng(item.name,item.colors,branding)}><ImageDown size={14} /> Export</button>
                  <button className="button ghost small" onClick={() => setDeleteTarget(item)}><Trash2 size={14} /> Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Bookmark size={28} />
            <h3>No saved palettes yet</h3>
            <p>Save the combinations you want to come back to.</p>
            <button className="button primary" onClick={() => createRef.current?.scrollIntoView({ behavior: "smooth" })}>Create a palette</button>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div><p className="kicker">Export</p><h2>Take the palette with you.</h2></div>
          <label className="branding-toggle"><span>PNG branding</span><input type="checkbox" checked={branding} onChange={(event) => setBranding(event.target.checked)} /></label>
        </div>

        <div className="export-layout">
          <div className="export-formats">
            {[
              ["hex","HEX list",Clipboard],
              ["css","CSS variables",Code2],
              ["tailwind","Tailwind snippet",Layers3],
              ["json","JSON",FileJson],
            ].map(([value,label,Icon]) => (
              <button key={String(value)} className={exportType === value ? "active" : ""} onClick={() => setExportType(value as ExportType)}>
                <Icon size={18} /><strong>{String(label)}</strong>
              </button>
            ))}
          </div>

          <div className="panel export-code">
            <div className="code-top">
              <span>{exportType}</span>
              <button className="button ghost small" onClick={() => copyText(exportContent, "Export copied")}>
                {copied === exportContent ? <Check size={14} /> : <Copy size={14} />} {copied === exportContent ? "Copied" : "Copy"}
              </button>
            </div>
            <pre>{exportContent}</pre>
            <div className="download-row">
              <button className="button outline" onClick={() => {
                const ext = exportType === "json" ? "json" : exportType === "css" ? "css" : "txt";
                paletteExport.downloadText(exportContent, `colorcraft-palette.${ext}`, exportType === "json" ? "application/json" : "text/plain");
              }}><Download size={16} /> Download file</button>
              <button className="button primary" onClick={() => paletteExport.downloadPng(paletteName,palette,branding).then(() => notify("PNG exported"))}><ImageDown size={16} /> Download PNG</button>
            </div>
          </div>
        </div>
      </section>

      <section className="how">
        <div><p className="kicker">How it works</p><h2>Generate. Test. Use.</h2></div>
        <ol>
          <li><span>1</span><strong>Shape</strong><p>Generate with color theory, lock what works, edit what doesn’t.</p></li>
          <li><span>2</span><strong>Check</strong><p>Run real WCAG contrast and preview the palette inside interfaces.</p></li>
          <li><span>3</span><strong>Ship</strong><p>Save locally, export values, or download a clean palette image.</p></li>
        </ol>
      </section>

      <footer>
        <div><strong>ColorCraft</strong><span>Build palettes that actually work.</span></div>
        <p>Made for better-looking buttons.</p>
      </footer>

      {editorOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && setEditorOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setEditorOpen(false)}><X size={18} /></button>
            <h2>Edit color</h2>
            <p>HEX, RGB, and HSL stay synchronized.</p>
            <div className="editor-preview" style={{ background: editorHex ?? selectedColor, color: colorMath.readableTextColor(editorHex ?? selectedColor) }}>
              <strong>{editorHex ?? "Invalid HEX"}</strong><span>{colorMath.approximateName(editorHex ?? selectedColor)}</span>
            </div>
            <label>Color picker<input type="color" value={editorHex ?? selectedColor} onChange={(event) => setEditorInput(event.target.value.toUpperCase())} /></label>
            <label>HEX<input className="mono" value={editorInput} onChange={(event) => setEditorInput(event.target.value)} />{!editorHex && <small className="error">Enter a valid HEX color.</small>}</label>
            <div className="editor-grid">
              {(["r","g","b"] as const).map((channel) => (
                <label key={channel}>{channel.toUpperCase()}<input type="number" min={0} max={255} value={editorRgb[channel]} onChange={(event) => updateEditorRgb(channel,Number(event.target.value))} /></label>
              ))}
            </div>
            <div className="editor-grid">
              {(["h","s","l"] as const).map((channel) => (
                <label key={channel}>{channel.toUpperCase()}<input type="number" min={0} max={channel === "h" ? 360 : 100} value={Math.round(editorHsl[channel])} onChange={(event) => updateEditorHsl(channel,Number(event.target.value))} /></label>
              ))}
            </div>
            <div className="modal-actions"><button className="button ghost" onClick={() => setEditorOpen(false)}>Cancel</button><button className="button primary" disabled={!editorHex} onClick={saveEditedColor}>Save color</button></div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && setImportOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setImportOpen(false)}><X size={18} /></button>
            <h2>Import palette</h2>
            <p>Paste 3–8 HEX colors separated by commas, spaces, or new lines.</p>
            <textarea rows={7} className="mono" value={importText} onChange={(event) => { setImportText(event.target.value); setImportError(""); }} placeholder={"#2563EB, #60A5FA, #E0F2FE\n#F8FAFC\n#0F172A"} />
            {importError && <small className="error">{importError}</small>}
            <div className="modal-actions"><button className="button ghost" onClick={() => setImportOpen(false)}>Cancel</button><button className="button primary" onClick={applyImport}>Import palette</button></div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal small-modal" role="dialog" aria-modal="true">
            <h2>Remove this saved palette?</h2>
            <p>{deleteTarget.name} will be removed from this browser.</p>
            <div className="modal-actions"><button className="button ghost" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="button danger" onClick={() => { setSaved((current) => current.filter((item) => item.id !== deleteTarget.id)); setDeleteTarget(null); notify("Saved palette removed"); }}>Remove</button></div>
          </div>
        </div>
      )}

      {shortcutOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && setShortcutOpen(false)}>
          <div className="modal small-modal" role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setShortcutOpen(false)}><X size={18} /></button>
            <h2>Keyboard shortcuts</h2>
            <div className="shortcut-list">
              {[["Space","Generate palette"],["L","Lock / unlock selected"],["C","Copy selected HEX"],["Z","Undo"],["Shift + Z","Redo"]].map(([key,label]) => <div key={key}><kbd>{key}</kbd><span>{label}</span></div>)}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
