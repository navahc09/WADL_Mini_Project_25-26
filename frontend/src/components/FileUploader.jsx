import { FileText, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "./ui/Button";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE_MB = 5;
const DOC_TYPES = ["Resume", "Marksheet", "Certificate", "Cover Letter", "Portfolio", "Other"];

function formatSize(size) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function inferDocumentType(file) {
  const name = file.name.toLowerCase();
  if (name.includes("resume") || name.includes("cv")) return "Resume";
  if (name.includes("cover")) return "Cover Letter";
  if (name.includes("mark") || name.includes("grade")) return "Marksheet";
  if (name.includes("cert")) return "Certificate";
  if (name.includes("portfolio")) return "Portfolio";
  if (file.type.startsWith("image/")) return "Other";
  return "Other";
}

export default function FileUploader({ onUpload, isUploading = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);

  function handleFiles(files) {
    const valid = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: use PDF, PNG, or JPG.`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5 MB.`);
        continue;
      }
      valid.push({ file, name: file.name, size: formatSize(file.size), type: inferDocumentType(file) });
    }
    if (valid.length) setPendingFiles(valid);
  }

  function updateType(idx, type) {
    setPendingFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, type } : f)));
  }

  async function confirmUpload() {
    if (!onUpload) {
      setRecentFiles(pendingFiles);
      setPendingFiles([]);
      toast.success(`${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""} ready.`);
      return;
    }
    try {
      const uploaded = [];
      for (const entry of pendingFiles) {
        const doc = await onUpload({ file: entry.file, docType: entry.type, primary: entry.type === "Resume" });
        uploaded.push(doc);
      }
      setRecentFiles(uploaded);
      setPendingFiles([]);
      toast.success(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded to vault.`);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Upload could not be completed right now.");
    }
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    handleFiles(Array.from(event.dataTransfer.files));
  }

  function onInputChange(event) {
    handleFiles(Array.from(event.target.files));
    event.target.value = "";
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`rounded-[1.4rem] border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-primary bg-primary-fixed/30" : "border-outline-variant bg-surface-container-low"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input ref={inputRef} type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={onInputChange} />
        <div className="flex flex-col items-center gap-4">
          <div className={`rounded-2xl p-4 transition-colors ${dragging ? "bg-primary text-white" : "bg-surface-container-lowest text-primary"}`}>
            <UploadCloud className="h-7 w-7" />
          </div>
          <div>
            <p className="font-headline text-xl font-bold text-on-surface">
              {dragging ? "Drop files here" : "Drop files or browse"}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">PDF, PNG, JPG · Max 5 MB each</p>
          </div>
          <Button disabled={isUploading} onClick={() => inputRef.current?.click()}>
            <UploadCloud className="h-4 w-4" />
            {isUploading ? "Uploading…" : "Choose Files"}
          </Button>
        </div>
      </div>

      {/* Type picker before upload */}
      {pendingFiles.length > 0 && (
        <div className="space-y-3 rounded-[1.2rem] border border-outline-variant/30 bg-surface-container-low p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Confirm document type before uploading
          </p>
          {pendingFiles.map((f, idx) => (
            <div key={f.name} className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-on-surface">{f.name}</p>
                  <p className="text-xs text-on-surface-variant">{f.size}</p>
                </div>
              </div>
              <select
                value={f.type}
                onChange={(e) => updateType(idx, e.target.value)}
                className="field-shell py-1.5 text-xs sm:w-40 shrink-0"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button size="sm" disabled={isUploading} onClick={confirmUpload}>
              <UploadCloud className="h-3.5 w-3.5" />
              {isUploading ? "Uploading…" : `Upload ${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""}`}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPendingFiles([])}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Recent uploads */}
      {recentFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Recent uploads</p>
          {recentFiles.map((file) => (
            <div key={file.id || file.name} className="flex items-center justify-between rounded-[1.2rem] bg-surface-container-low px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-surface-container-lowest p-2 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{file.name || file.file?.name}</p>
                  <p className="text-xs text-on-surface-variant">{file.type} · {file.size}</p>
                </div>
              </div>
              {file.primary && (
                <span className="rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-on-primary-fixed-variant">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
