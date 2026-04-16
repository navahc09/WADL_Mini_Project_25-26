import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  Lock,
  MapPin,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useApplications, useApplyToJob } from "../../hooks/useApplications";
import { useJob } from "../../hooks/useJobs";
import { useDocuments } from "../../hooks/useStudent";

export default function JobDetailPage() {
  const { id } = useParams();
  const { data: job, isLoading, isError, error } = useJob(id);
  const { data: applications = [] } = useApplications("all");
  const { mutateAsync: applyToJob, isPending: isApplying } = useApplyToJob();
  const { data: documents = [] } = useDocuments();

  const [showResumePicker, setShowResumePicker] = useState(false);
  const resumes = documents.filter((d) => d.type?.toLowerCase().includes("resume"));
  const primaryResume = resumes.find((d) => d.primary) || resumes[0] || null;
  const [selectedDocId, setSelectedDocId] = useState(null);

  const existingApplication = applications.find((a) => a.jobId === id);
  const deadlinePassed = job?.deadlineRaw ? new Date(job.deadlineRaw) < new Date() : false;

  if (isLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading opportunity…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Pulling job details from the backend.</p>
      </SurfaceCard>
    );
  }

  if (isError || !job) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Opportunity not found</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "The requested job could not be located."}
        </p>
        <Link className="mt-3 inline-flex" to="/student/jobs">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to board
          </Button>
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link className="inline-flex" to="/student/jobs">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Job Board
        </Button>
      </Link>

      {/* Main 2-col layout */}
      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Left — job detail */}
        <SurfaceCard className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Opportunity Review</p>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight">{job.title}</h2>
              <p className="mt-0.5 text-sm font-semibold text-primary">{job.company}</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant line-clamp-3">{job.description}</p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low font-headline text-xl font-extrabold text-primary">
              {job.companyInitials}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { icon: Wallet, label: "Compensation", value: job.salaryLabel },
              { icon: MapPin, label: "Location & Mode", value: `${job.location} · ${job.mode}` },
              { icon: Building2, label: "Role Type", value: job.type },
              { icon: CalendarClock, label: "Deadline", value: job.deadline },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl bg-surface-container-low p-3">
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </div>
                <p className="mt-1 text-sm font-bold text-on-surface">{value}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        {/* Right — eligibility + apply */}
        <div className="space-y-3">
          <SurfaceCard className="p-4">
            <p className="section-label">Eligibility</p>
            <div className="mt-3 space-y-3">
              {/* Eligibility badge */}
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                job.eligible !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {job.eligible !== false
                  ? <><CheckCircle2 className="h-4 w-4" /> You are eligible for this role</>
                  : <><AlertTriangle className="h-4 w-4" /> You are not eligible for this role</>}
              </div>

              {/* Ineligibility reasons */}
              {job.eligible === false && job.reasons?.length > 0 && (
                <div className="space-y-1.5 rounded-xl border border-red-100 bg-red-50/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">Why you're not eligible</p>
                  <ul className="space-y-1">
                    {job.reasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-2 text-xs text-red-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CGPA + branches */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-surface-container-low p-3">
                  <p className="text-xs text-on-surface-variant">Min CGPA</p>
                  <p className="mt-1 font-headline text-2xl font-extrabold">{job.minCgpa}</p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3">
                  <p className="mb-1.5 text-xs text-on-surface-variant">Eligible Branches</p>
                  <div className="flex flex-wrap gap-1">
                    {job.branches.map((branch) => (
                      <span key={branch} className="rounded-full bg-surface-container-lowest px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                        {branch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply / Status */}
              {existingApplication ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Application submitted
                </div>
              ) : deadlinePassed ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface-variant">
                  <Lock className="h-4 w-4" /> Deadline passed
                </div>
              ) : (
                <>
                  {showResumePicker && resumes.length > 0 && (
                    <div className="space-y-1.5 rounded-xl border border-surface-container-low bg-surface-container-low/50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-outline">Select Resume</p>
                      {resumes.map((doc) => (
                        <label key={doc.id} className={`flex cursor-pointer items-center gap-2 rounded-xl p-2 transition-colors ${
                          (selectedDocId || primaryResume?.id) === doc.id
                            ? "bg-primary/10 ring-1 ring-primary"
                            : "hover:bg-surface-container-lowest"
                        }`}>
                          <input type="radio" name="resumePick" value={doc.id}
                            checked={(selectedDocId ?? primaryResume?.id) === doc.id}
                            onChange={() => setSelectedDocId(doc.id)} className="accent-primary" />
                          <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-on-surface">{doc.name}</p>
                            <p className="text-xs text-on-surface-variant">{doc.size} · {doc.updatedAt}</p>
                          </div>
                          {doc.primary && (
                            <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Primary</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                  <Button className="w-full" disabled={isApplying || !job.eligible}
                    onClick={async () => {
                      if (resumes.length > 1 && !showResumePicker) { setShowResumePicker(true); return; }
                      try {
                        await applyToJob({ jobId: job.id, documentId: selectedDocId || primaryResume?.id });
                        toast.success(`Applied to ${job.title} at ${job.company}.`);
                      } catch (applyError) {
                        const details = applyError?.response?.data?.details;
                        toast.error(applyError?.response?.data?.error || (Array.isArray(details) ? details.join(", ") : null) || "Application failed.");
                      }
                    }}>
                    {isApplying ? "Submitting…" : resumes.length > 1 && !showResumePicker ? "Select Resume & Apply" : "Apply with selected resume"}
                  </Button>
                </>
              )}
            </div>
          </SurfaceCard>

          {/* Selection process */}
          {job.process?.length > 0 && (
            <SurfaceCard className="p-4">
              <p className="section-label">Selection Process</p>
              <div className="mt-3 space-y-2">
                {job.process.map((step, index) => (
                  <div key={step} className="flex items-start gap-2.5 rounded-xl bg-surface-container-low p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <p className="pt-0.5 text-xs text-on-surface-variant">{step}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}
        </div>
      </div>

      {/* Bottom sections */}
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Responsibilities</h3>
          <div className="mt-3 space-y-2">
            {job.responsibilities.map((item) => (
              <div key={item} className="flex gap-2.5 rounded-xl bg-surface-container-low p-3">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="text-xs leading-5 text-on-surface-variant">{item}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Requirements</h3>
          <div className="mt-3 space-y-2">
            {job.requirements.map((item) => (
              <div key={item} className="rounded-xl bg-surface-container-low p-3">
                <p className="text-xs leading-5 text-on-surface-variant">{item}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_0.8fr]">
        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">About the company</h3>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{job.aboutCompany}</p>
        </SurfaceCard>

        {job.perks?.length > 0 && (
          <SurfaceCard className="p-4">
            <h3 className="font-semibold text-on-surface">Perks & signals</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.perks.map((perk) => (
                <span key={perk} className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
                  {perk}
                </span>
              ))}
            </div>
          </SurfaceCard>
        )}
      </div>
    </div>
  );
}
