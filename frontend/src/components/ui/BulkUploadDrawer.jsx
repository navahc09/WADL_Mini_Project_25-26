/**
 * BulkUploadDrawer.jsx
 *
 * Three-stage flow:
 *   Stage 1 — Upload   : Drag-and-drop .xlsx or .csv
 *   Stage 2 — Map      : (CSV only) Map CSV columns → DB fields
 *   Stage 3 — Preview  : Table showing all rows; invalid rows highlighted
 *   Stage 4 — Confirm  : POST to bulk-confirm; shows summary
 */

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import Papa from "papaparse";
import { useBulkUpload, useBulkConfirm } from "../../hooks/useAdmin";
import Button from "./Button";

const STAGE = {
  UPLOAD:  "upload",
  MAP:     "map",
  PREVIEW: "preview",
  DONE:    "done",
};

// ── Pretty field labels ───────────────────────────────────────────────────────
const FIELD_LABELS = {
  fullName:       "Full Name",
  email:          "Email",
  enrollmentNo:   "Enrollment No.",
  phone:          "Phone",
  branch:         "Branch",
  graduationYear: "Graduation Year",
  cgpa:           "CGPA",
  gender:         "Gender",
  city:           "City",
  tenthPercent:   "10th %",
  twelfthPercent: "12th %",
  dateOfBirth:    "Date of Birth",
};

const ALL_FIELD_KEYS = Object.keys(FIELD_LABELS);

// ── Helper ────────────────────────────────────────────────────────────────────
function Badge({ children, variant = "default" }) {
  const cls = {
    default: "bg-surface-container-low text-on-surface-variant",
    success: "bg-emerald-100 text-emerald-700",
    error:   "bg-red-100 text-red-600",
    warn:    "bg-amber-100 text-amber-700",
  }[variant];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {children}
    </span>
  );
}

// ── Stage 1: Upload ───────────────────────────────────────────────────────────
function UploadStage({ onFileChosen }) {
  const inputRef   = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error,    setError]    = useState("");

  function handleFile(file) {
    setError("");
    const ext = (file.name || "").split(".").pop().toLowerCase();
    if (!["xlsx", "csv"].includes(ext)) {
      setError("Only .xlsx and .csv files are accepted.");
      return;
    }
    onFileChosen(file, ext);
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex w-full max-w-md cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-8 py-10 transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-outline-variant/40 bg-surface-container-low/50 hover:border-primary/40 hover:bg-primary/5"
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileSpreadsheet className="h-7 w-7" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-on-surface">Drop your file here</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Supports <span className="font-mono">.xlsx</span> and <span className="font-mono">.csv</span>
            {" "}— up to 10 MB
          </p>
        </div>
        <Button size="sm" type="button">
          <Upload className="h-3.5 w-3.5" />
          Browse File
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-error">
          <XCircle className="h-4 w-4" /> {error}
        </p>
      )}

      <div className="mt-2 w-full max-w-md rounded-xl bg-blue-50 px-4 py-3">
        <p className="text-xs font-semibold text-blue-700 mb-1.5">Supported column headers</p>
        <div className="flex flex-wrap gap-1.5">
          {["Full Name", "Email", "Enrollment No", "Branch", "CGPA", "Graduation Year",
            "Phone", "Gender", "City", "10th %", "12th %"].map((h) => (
            <span key={h} className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] text-blue-700">
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stage 2: Column Mapping (CSV) ─────────────────────────────────────────────
function MapStage({ headers, autoMapping, onConfirm }) {
  const [mapping, setMapping] = useState(autoMapping);

  function setMap(colIndex, fieldKey) {
    setMapping((prev) => {
      const next = [...prev];
      next[colIndex] = fieldKey || null;
      return next;
    });
  }

  const requiredFields = ["fullName", "email", "enrollmentNo", "branch", "cgpa", "graduationYear"];
  const mappedFields   = mapping.filter(Boolean);
  const missingRequired = requiredFields.filter((f) => !mappedFields.includes(f));

  return (
    <div className="flex flex-col gap-4 px-6 py-4">
      <div>
        <p className="font-semibold text-on-surface text-sm">Map CSV columns to student fields</p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          We auto-detected mappings where possible. Adjust any that look wrong.
        </p>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-xl border border-outline-variant/30">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low">
              <th className="px-3 py-2 text-left font-semibold text-on-surface-variant">CSV Column</th>
              <th className="px-3 py-2 text-left font-semibold text-on-surface-variant">Maps To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {headers.map((h, i) => (
              <tr key={i}>
                <td className="px-3 py-2 font-mono text-on-surface">{h}</td>
                <td className="px-3 py-2">
                  <div className="relative">
                    <select
                      value={mapping[i] || ""}
                      onChange={(e) => setMap(i, e.target.value)}
                      className="field-shell w-full appearance-none py-1.5 pr-7 text-xs"
                    >
                      <option value="">— skip —</option>
                      {ALL_FIELD_KEYS.map((k) => (
                        <option key={k} value={k}>{FIELD_LABELS[k]}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-outline" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missingRequired.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Required fields not mapped: {missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}
        </div>
      )}

      <Button
        size="sm"
        disabled={missingRequired.length > 0}
        onClick={() => onConfirm(mapping)}
        className="w-full"
      >
        Next: Preview Rows
      </Button>
    </div>
  );
}

// ── Stage 3: Preview ──────────────────────────────────────────────────────────
function PreviewStage({ previewData, onConfirm, onBack, isImporting }) {
  const { preview = [], validRows = 0, invalidRows = 0 } = previewData;
  const [showOnlyInvalid, setShowOnlyInvalid] = useState(false);

  const displayed = showOnlyInvalid ? preview.filter((r) => !r._valid) : preview;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Rows",   value: preview.length, variant: "default" },
          { label: "Valid",        value: validRows,       variant: "success" },
          { label: "Errors",       value: invalidRows,     variant: invalidRows > 0 ? "error" : "default" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-surface-container-low p-3 text-center">
            <p className={`font-headline text-2xl font-extrabold ${
              s.variant === "success" ? "text-emerald-600"
              : s.variant === "error"   ? "text-red-600"
              : "text-on-surface"
            }`}>{s.value}</p>
            <p className="text-[10px] text-on-surface-variant">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toggle */}
      {invalidRows > 0 && (
        <button
          type="button"
          onClick={() => setShowOnlyInvalid((p) => !p)}
          className="text-xs font-medium text-primary underline text-left"
        >
          {showOnlyInvalid ? "Show all rows" : `Show only ${invalidRows} row(s) with errors`}
        </button>
      )}

      {/* Table */}
      <div className="max-h-72 overflow-auto rounded-xl border border-outline-variant/30 text-xs">
        <table className="w-full min-w-[600px]">
          <thead className="sticky top-0 bg-surface-container-low z-10">
            <tr className="border-b border-outline-variant/30">
              <th className="px-2 py-2 text-left font-semibold text-on-surface-variant">#</th>
              <th className="px-2 py-2 text-left font-semibold text-on-surface-variant">Name</th>
              <th className="px-2 py-2 text-left font-semibold text-on-surface-variant">Email</th>
              <th className="px-2 py-2 text-left font-semibold text-on-surface-variant">Enrollment</th>
              <th className="px-2 py-2 text-left font-semibold text-on-surface-variant">Branch</th>
              <th className="px-2 py-2 text-left font-semibold text-on-surface-variant">CGPA</th>
              <th className="px-2 py-2 text-left font-semibold text-on-surface-variant">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {displayed.map((row) => (
              <tr key={row._rowIndex} className={row._valid ? "" : "bg-red-50/60"}>
                <td className="px-2 py-2 text-on-surface-variant">{row._rowIndex}</td>
                <td className="px-2 py-2 font-medium text-on-surface">{row.fullName || "—"}</td>
                <td className="px-2 py-2 text-on-surface-variant truncate max-w-[160px]">{row.email || "—"}</td>
                <td className="px-2 py-2 font-mono text-on-surface-variant">{row.enrollmentNo || "—"}</td>
                <td className="px-2 py-2 text-on-surface-variant">{row.branch || "—"}</td>
                <td className="px-2 py-2 text-on-surface-variant">{row.cgpa || "—"}</td>
                <td className="px-2 py-2">
                  {row._valid ? (
                    <Badge variant="success">Valid</Badge>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {row._errors.map((e, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] text-red-600">
                          <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {validRows === 0 && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0" />
          No valid rows found. Please fix the errors and re-upload.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          className="flex-1"
          disabled={validRows === 0 || isImporting}
          onClick={onConfirm}
        >
          {isImporting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
            : `Import ${validRows} Valid Student${validRows !== 1 ? "s" : ""}`}
        </Button>
        <Button type="button" variant="secondary" onClick={onBack} disabled={isImporting}>
          Back
        </Button>
      </div>
    </div>
  );
}

// ── Stage 4: Done ─────────────────────────────────────────────────────────────
function DoneStage({ result, onClose, onReset }) {
  const { created, failed, details } = result;
  return (
    <div className="flex flex-col items-center gap-5 px-6 py-10">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
        failed === 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
      }`}>
        {failed === 0
          ? <CheckCircle2 className="h-8 w-8" />
          : <AlertTriangle className="h-8 w-8" />}
      </div>

      <div className="text-center">
        <p className="font-headline text-xl font-bold text-on-surface">
          {failed === 0 ? "Import complete!" : "Import partially completed"}
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">
          <span className="font-semibold text-emerald-600">{created} students created</span>
          {failed > 0 && (
            <>, <span className="font-semibold text-red-600">{failed} failed</span></>
          )}
        </p>
      </div>

      {failed > 0 && details?.failed?.length > 0 && (
        <div className="w-full rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">
          <p className="font-semibold mb-1.5">Failed rows:</p>
          {details.failed.map((f, i) => (
            <p key={i} className="truncate">{f.email} — {f.error}</p>
          ))}
        </div>
      )}

      <div className="flex gap-3 w-full">
        <Button className="flex-1" onClick={onClose}>Done</Button>
        <Button variant="secondary" onClick={onReset}>Upload Another</Button>
      </div>
    </div>
  );
}

// ── Root Drawer ───────────────────────────────────────────────────────────────
export default function BulkUploadDrawer({ open, onClose }) {
  const [stage,       setStage]       = useState(STAGE.UPLOAD);
  const [file,        setFile]        = useState(null);
  const [fileExt,     setFileExt]     = useState("");
  const [headers,     setHeaders]     = useState([]);
  const [autoMapping, setAutoMapping] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const { mutateAsync: bulkUpload,  isPending: isParsing    } = useBulkUpload();
  const { mutateAsync: bulkConfirm, isPending: isImporting  } = useBulkConfirm();

  function reset() {
    setStage(STAGE.UPLOAD);
    setFile(null);
    setFileExt("");
    setHeaders([]);
    setAutoMapping([]);
    setPreviewData(null);
    setImportResult(null);
  }

  async function handleFileChosen(chosen, ext) {
    setFile(chosen);
    setFileExt(ext);

    // For CSV, parse headers client-side first, show mapping UI
    if (ext === "csv") {
      const text = await chosen.text();
      Papa.parse(text, {
        preview: 1,
        complete: ({ data }) => {
          const hdrs = (data[0] || []).map((h) => String(h).trim());
          setHeaders(hdrs);

          // Auto-detect mapping on client using known heuristics
          const AUTO = {
            "full name": "fullName",  name: "fullName",
            email: "email",           "email address": "email",
            "enrollment no": "enrollmentNo", "roll number": "enrollmentNo",
            "roll no": "enrollmentNo", "enrollment number": "enrollmentNo",
            phone: "phone",            mobile: "phone",
            branch: "branch",          department: "branch",
            "graduation year": "graduationYear", year: "graduationYear",
            cgpa: "cgpa",              gpa: "cgpa",
            gender: "gender",
            city: "city",
            "10th %": "tenthPercent",  ssc: "tenthPercent",
            "12th %": "twelfthPercent", hsc: "twelfthPercent",
            dob: "dateOfBirth",        "date of birth": "dateOfBirth",
          };
          setAutoMapping(hdrs.map((h) => AUTO[h.toLowerCase()] || null));
          setStage(STAGE.MAP);
        },
      });
      return;
    }

    // For xlsx — parse and preview immediately
    await parseAndPreview(chosen, ext, null);
  }

  async function parseAndPreview(chosen, ext, mapping) {
    try {
      const formData = new FormData();
      formData.append("file", chosen);
      if (mapping) formData.append("mapping", JSON.stringify(mapping));

      const data = await bulkUpload(formData);
      setPreviewData(data);
      setStage(STAGE.PREVIEW);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not parse file.");
    }
  }

  async function handleMappingConfirm(mapping) {
    await parseAndPreview(file, fileExt, mapping);
  }

  async function handleImportConfirm() {
    if (!previewData) return;
    const validRows = previewData.preview.filter((r) => r._valid);
    try {
      const result = await bulkConfirm(validRows);
      setImportResult(result);
      setStage(STAGE.DONE);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Import failed.");
    }
  }

  if (!open) return null;

  const STAGE_LABELS = {
    [STAGE.UPLOAD]:  "Upload File",
    [STAGE.MAP]:     "Map Columns",
    [STAGE.PREVIEW]: "Preview & Confirm",
    [STAGE.DONE]:    "Done",
  };

  const STAGE_STEPS = [STAGE.UPLOAD, STAGE.MAP, STAGE.PREVIEW, STAGE.DONE];
  const currentIdx  = STAGE_STEPS.indexOf(stage);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={stage !== STAGE.DONE ? reset : undefined} />

      <div className="relative ml-auto flex h-full w-full max-w-[560px] flex-col bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant/20 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Bulk Import
            </p>
            <h3 className="font-headline text-xl font-bold text-on-surface">
              {STAGE_LABELS[stage]}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="rounded-xl p-1.5 text-on-surface-variant hover:bg-surface-container-low"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        {stage !== STAGE.DONE && (
          <div className="flex items-center gap-0 border-b border-outline-variant/20 px-5 py-2">
            {[STAGE.UPLOAD, STAGE.MAP, STAGE.PREVIEW].map((s, i) => (
              <div key={s} className="flex items-center gap-0">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  i < currentIdx ? "bg-primary text-white"
                  : i === currentIdx ? "border-2 border-primary text-primary"
                  : "border border-outline-variant/40 text-outline"
                }`}>
                  {i < currentIdx ? "✓" : i + 1}
                </div>
                <span className={`ml-1.5 text-xs font-medium ${i === currentIdx ? "text-primary" : "text-outline"}`}>
                  {STAGE_LABELS[s]}
                </span>
                {i < 2 && <div className="mx-3 h-px w-8 bg-outline-variant/30" />}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {stage === STAGE.UPLOAD && (
            <UploadStage onFileChosen={handleFileChosen} />
          )}

          {stage === STAGE.MAP && (
            isParsing ? (
              <div className="flex items-center gap-3 justify-center py-16 text-on-surface-variant">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Analysing file…</span>
              </div>
            ) : (
              <MapStage
                headers={headers}
                autoMapping={autoMapping}
                onConfirm={handleMappingConfirm}
              />
            )
          )}

          {stage === STAGE.PREVIEW && (
            isParsing ? (
              <div className="flex items-center gap-3 justify-center py-16 text-on-surface-variant">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Building preview…</span>
              </div>
            ) : previewData ? (
              <PreviewStage
                previewData={previewData}
                onConfirm={handleImportConfirm}
                onBack={() => setStage(fileExt === "csv" ? STAGE.MAP : STAGE.UPLOAD)}
                isImporting={isImporting}
              />
            ) : null
          )}

          {stage === STAGE.DONE && importResult && (
            <DoneStage
              result={importResult}
              onClose={() => { reset(); onClose(); }}
              onReset={reset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
