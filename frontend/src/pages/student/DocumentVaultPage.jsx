import { Download, ExternalLink, FileText, ShieldCheck, Sparkles, Star } from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import FileUploader from "../../components/FileUploader";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useDocuments } from "../../hooks/useStudent";

export default function DocumentVaultPage() {
  const {
    data: documents = [],
    isLoading,
    isError,
    error,
    uploadDocument,
    isUploading,
    setPrimary,
    isSettingPrimary,
    accessDocument,
  } = useDocuments();

  async function handleSetPrimary(docId) {
    try {
      await setPrimary(docId);
      toast.success("Primary resume updated.");
    } catch {
      toast.error("Could not update primary resume.");
    }
  }

  async function openDocument(documentId, action = "view") {
    try {
      const { url } = await accessDocument(documentId, action);
      if (action === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (accessError) {
      toast.error(accessError?.response?.data?.error || "Secure link could not be created.");
    }
  }

  if (isLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading document vault…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Fetching stored resumes and files.</p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Document vault unavailable</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load documents right now."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Document Vault</p>
        <h2 className="font-headline text-lg font-bold">Files powering your applications</h2>
      </div>

      <FileUploader isUploading={isUploading} onUpload={uploadDocument} />

      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Documents list */}
        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Stored Documents</h3>
          <div className="mt-3 space-y-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-surface-container-lowest p-2.5 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{document.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {document.type} · {document.size} · {document.updatedAt}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {document.primary ? (
                    <span className="rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-on-primary-fixed-variant">
                      Primary
                    </span>
                  ) : document.type?.toLowerCase().includes("resume") ? (
                    <button
                      type="button"
                      disabled={isSettingPrimary}
                      onClick={() => void handleSetPrimary(document.id)}
                      className="flex items-center gap-1 rounded-full border border-outline-variant/40 px-2.5 py-1 text-[10px] font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                      title="Set as primary resume"
                    >
                      <Star className="h-3 w-3" /> Set Primary
                    </button>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => void openDocument(document.id, "view")}>
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => void openDocument(document.id, "download")}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <p className="py-4 text-center text-sm text-on-surface-variant">No documents uploaded yet.</p>
            )}
          </div>
        </SurfaceCard>

        {/* Sidebar */}
        <div className="space-y-3">
          <SurfaceCard className="p-4">
            <div className="rounded-xl bg-signature p-4 text-white">
              <p className="text-xs text-white/70">Snapshot Integrity</p>
              <h3 className="mt-1 font-headline text-lg font-extrabold">Immutable by design</h3>
              <p className="mt-2 text-xs leading-5 text-white/75">
                Once an application is submitted, the attached resume stays fixed for that submission.
              </p>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-4">
            <h3 className="font-semibold text-on-surface">Vault Checklist</h3>
            <div className="mt-3 space-y-2">
              {[
                "Maintain one clearly labeled primary resume.",
                "Upload marksheets after each semester update.",
                "Store role-specific cover letters only when required.",
              ].map((item) => (
                <div key={item} className="flex gap-2.5 rounded-xl bg-surface-container-low p-3">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-xs leading-5 text-on-surface-variant">{item}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-tertiary-fixed p-2.5 text-tertiary">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Recruiter tip</p>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                  Clean, versioned document names help placement officers export application sets faster.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
