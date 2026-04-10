import { Download, ExternalLink, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import FileUploader from "../../components/FileUploader";
import SectionHeading from "../../components/ui/SectionHeading";
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
    accessDocument,
  } = useDocuments();

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
      const message =
        accessError?.response?.data?.error || "The secure document link could not be created.";
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading document vault</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Fetching stored resumes, marksheets, and supporting files from the backend.
        </p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Document vault unavailable</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load documents right now."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        label="Document Vault"
        title="Store the files that power every application snapshot"
        description="Your resumes, proofs, and academic documents stay organized here so recruiter-facing data is consistent when applications are submitted."
      />

      <FileUploader isUploading={isUploading} onUpload={uploadDocument} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="p-6">
          <h3 className="font-headline text-2xl font-bold">Stored Documents</h3>
          <div className="mt-5 space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-4 rounded-[1.3rem] bg-surface-container-low p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-surface-container-lowest p-3 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">{document.name}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {document.type} - {document.size} - Updated {document.updatedAt}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {document.primary ? (
                    <span className="rounded-full bg-primary-fixed px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-primary-fixed-variant">
                      Primary Resume
                    </span>
                  ) : null}
                  <Button
                    variant="ghost"
                    className="px-3"
                    onClick={() => void openDocument(document.id, "view")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-3"
                    onClick={() => void openDocument(document.id, "download")}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <div className="rounded-[1.4rem] bg-signature p-6 text-white">
              <p className="text-sm text-white/70">Snapshot Integrity</p>
              <h3 className="mt-2 font-headline text-3xl font-extrabold">Immutable by design</h3>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Once an application is created, the attached resume and academic state remain fixed
                for that submission, even if you upload a newer version later.
              </p>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <h3 className="font-headline text-2xl font-bold">Vault Checklist</h3>
            <div className="mt-5 space-y-3">
              {[
                "Maintain one clearly labeled primary resume.",
                "Upload marksheets after each semester update.",
                "Store role-specific cover letters only when required.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-[1.2rem] bg-surface-container-low p-4">
                  <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-on-surface-variant">{item}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-tertiary-fixed p-3 text-tertiary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-on-surface">Recruiter tip</p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Document names that are clean and versioned help placement officers export and
                  audit application sets faster.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
