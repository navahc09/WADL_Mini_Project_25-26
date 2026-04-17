/**
 * CompanyExportTemplatePage.jsx
 *
 * Admin can configure per-company Excel export templates:
 *  - Pick columns & reorder via drag-and-drop
 *  - Toggle CGPA / percentage / photo
 *  - Pick header colour
 *  - Live column-order preview
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Palette,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import { useExportTemplate, useSaveExportTemplate } from "../../hooks/useAdmin";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";

// Preset header colours
const COLOR_PRESETS = [
  { label: "Royal Blue",  argb: "FF2563EB" },
  { label: "Indigo",      argb: "FF4338CA" },
  { label: "Violet",      argb: "FF7C3AED" },
  { label: "Emerald",     argb: "FF059669" },
  { label: "Slate",       argb: "FF475569" },
  { label: "Rose",        argb: "FFE11D48" },
  { label: "Amber",       argb: "FFD97706" },
  { label: "Cyan",        argb: "FF0891B2" },
];

function argbToHex(argb) {
  // ARGB "FF2563EB" → "#2563EB"
  return "#" + argb.slice(2);
}

function hexToArgb(hex) {
  // "#2563EB" → "FF2563EB"
  return "FF" + hex.replace("#", "").toUpperCase();
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-primary" : "bg-outline-variant/40"
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
        checked ? "translate-x-4" : "translate-x-0"
      }`} />
    </button>
  );
}

export default function CompanyExportTemplatePage() {
  const { companyId } = useParams();
  const navigate      = useNavigate();

  const { data, isLoading, isError } = useExportTemplate(companyId);
  const { mutateAsync: save, isPending: isSaving } = useSaveExportTemplate(companyId);

  // Local form state
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showCgpa,    setShowCgpa]    = useState(true);
  const [showPercent, setShowPercent] = useState(true);
  const [showPhoto,   setShowPhoto]   = useState(false);
  const [headerColor, setHeaderColor] = useState("FF2563EB");
  const [templateName, setTemplateName] = useState("Default");

  const availableColumns = data?.availableColumns || [];

  // Seed from loaded template
  useEffect(() => {
    if (!data) return;
    const t = data.template;
    if (t) {
      setSelectedColumns(t.columns || []);
      setShowCgpa(t.show_cgpa ?? true);
      setShowPercent(t.show_percent ?? true);
      setShowPhoto(t.show_photo ?? false);
      setHeaderColor(t.header_color || "FF2563EB");
      setTemplateName(t.template_name || "Default");
    } else if (availableColumns.length > 0) {
      // Default set
      setSelectedColumns([
        "sno", "full_name", "roll_number", "email", "branch", "cgpa",
        "active_backlogs", "tenth_percent", "twelfth_percent", "skills", "status", "applied_at",
      ]);
    }
  }, [data]);

  // Toggle a column in/out
  function toggleColumn(key) {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  // Move column up/down
  function moveColumn(key, dir) {
    setSelectedColumns((prev) => {
      const idx  = prev.indexOf(key);
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  async function handleSave() {
    if (selectedColumns.length === 0) {
      toast.error("Select at least one column.");
      return;
    }
    try {
      await save({ columns: selectedColumns, showCgpa, showPercent, showPhoto, headerColor, templateName });
      toast.success("Template saved — next export will use these settings.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not save template.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-16 text-on-surface-variant">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading template…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-5">
        <p className="text-sm text-error">Failed to load template. Try refreshing.</p>
      </SurfaceCard>
    );
  }

  const unselected = availableColumns.filter((c) => !selectedColumns.includes(c.key));

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-outline">/</span>
        <p className="text-sm text-on-surface">Export Template</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Company Settings
          </p>
          <h2 className="font-headline text-lg font-bold">Branded Export Template</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Configure which columns to export for this company and in what order.
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving…" : "Save Template"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Left — Column config */}
        <div className="space-y-4">

          {/* Template name */}
          <SurfaceCard className="p-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Template / Sheet Name
              </span>
              <input
                className="field-shell w-full py-2 text-sm"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. TCS Applicants"
              />
            </label>
          </SurfaceCard>

          {/* Selected columns — drag to reorder */}
          <SurfaceCard className="p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Selected Columns ({selectedColumns.length}) — in export order
            </p>

            {selectedColumns.length === 0 ? (
              <p className="py-4 text-center text-sm text-outline">
                No columns selected. Pick some from the right panel.
              </p>
            ) : (
              <div className="space-y-1.5">
                {selectedColumns.map((key, idx) => {
                  const col = availableColumns.find((c) => c.key === key);
                  if (!col) return null;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2"
                    >
                      <GripVertical className="h-4 w-4 text-outline shrink-0" />
                      <span className="flex-1 text-sm font-medium text-on-surface">{col.header}</span>
                      <span className="font-mono text-[10px] text-outline">{col.key}</span>
                      <div className="flex gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => moveColumn(key, -1)}
                          disabled={idx === 0}
                          className="rounded p-0.5 hover:bg-surface-container disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="h-3.5 w-3.5 text-on-surface-variant" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveColumn(key, 1)}
                          disabled={idx === selectedColumns.length - 1}
                          className="rounded p-0.5 hover:bg-surface-container disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="h-3.5 w-3.5 text-on-surface-variant" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleColumn(key)}
                          className="rounded p-0.5 text-error hover:bg-red-50"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add from unselected */}
            {unselected.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-outline">
                  Available to add
                </p>
                <div className="flex flex-wrap gap-2">
                  {unselected.map((col) => (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleColumn(col.key)}
                      className="rounded-full border border-outline-variant/40 px-2.5 py-1 text-xs font-medium text-on-surface-variant hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      + {col.header}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </SurfaceCard>
        </div>

        {/* Right — Display options + colour */}
        <div className="space-y-4">

          {/* Display toggles */}
          <SurfaceCard className="p-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Display Options
            </p>

            {[
              { id: "show-cgpa",    label: "Show CGPA",         sub: "Include CGPA column",            val: showCgpa,    set: setShowCgpa },
              { id: "show-percent", label: "Show Avg %",        sub: "Include computed average %",      val: showPercent, set: setShowPercent },
              { id: "show-photo",   label: "Include Photo",     sub: "Embed profile photo (if stored)", val: showPhoto,   set: setShowPhoto },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface">{item.label}</p>
                  <p className="text-[11px] text-on-surface-variant">{item.sub}</p>
                </div>
                <Toggle id={item.id} checked={item.val} onChange={item.set} />
              </div>
            ))}
          </SurfaceCard>

          {/* Header colour */}
          <SurfaceCard className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-on-surface-variant" />
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Header Colour
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.argb}
                  type="button"
                  title={preset.label}
                  onClick={() => setHeaderColor(preset.argb)}
                  className={`h-8 w-full rounded-lg transition-all ${
                    headerColor === preset.argb
                      ? "ring-2 ring-offset-2 ring-on-surface scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: argbToHex(preset.argb) }}
                />
              ))}
            </div>

            {/* Custom hex */}
            <label className="flex items-center gap-2 mt-1">
              <span className="text-xs text-on-surface-variant w-16 shrink-0">Custom:</span>
              <input
                type="color"
                value={argbToHex(headerColor)}
                onChange={(e) => setHeaderColor(hexToArgb(e.target.value))}
                className="h-8 w-12 cursor-pointer rounded border border-outline-variant/40"
              />
              <span className="font-mono text-xs text-outline">{argbToHex(headerColor)}</span>
            </label>
          </SurfaceCard>

          {/* Preview pill */}
          <SurfaceCard className="p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Preview
            </p>
            <div className="overflow-hidden rounded-xl border border-outline-variant/30 text-xs">
              <div
                className="px-3 py-2 font-bold text-white"
                style={{ backgroundColor: argbToHex(headerColor) }}
              >
                <div className="flex gap-3 overflow-hidden">
                  {selectedColumns.slice(0, 5).map((key) => {
                    const col = availableColumns.find((c) => c.key === key);
                    return (
                      <span key={key} className="shrink-0">{col?.header || key}</span>
                    );
                  })}
                  {selectedColumns.length > 5 && (
                    <span className="opacity-70">+{selectedColumns.length - 5} more</span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {[1, 2].map((n) => (
                  <div key={n} className={`flex gap-3 px-3 py-1.5 ${n % 2 === 0 ? "bg-blue-50/30" : ""}`}>
                    {selectedColumns.slice(0, 5).map((key) => (
                      <span key={key} className="shrink-0 text-outline">—</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[10px] text-outline">
              {selectedColumns.length} column{selectedColumns.length !== 1 ? "s" : ""} ·{" "}
              header: <span className="font-mono">{argbToHex(headerColor)}</span>
            </p>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
