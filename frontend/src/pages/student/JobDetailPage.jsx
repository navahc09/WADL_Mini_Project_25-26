import {
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

  const existingApplication = applications.find((application) => application.jobId === id);

  // Check if deadline has passed
  const deadlinePassed = job?.deadlineRaw
    ? new Date(job.deadlineRaw) < new Date()
    : false;

  if (isLoading) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading opportunity</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Pulling the latest job details and eligibility context from the backend.
        </p>
      </SurfaceCard>
    );
  }

  if (isError || !job) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Opportunity not found</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          {error?.response?.data?.error ||
            "The requested job card could not be located in the current dataset."}
        </p>
        <Link className="mt-6 inline-flex" to="/student/jobs">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to board
          </Button>
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <Link className="inline-flex" to="/student/jobs">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4" />
          Back to Job Board
        </Button>
      </Link>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="p-7 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <span className="section-label">Opportunity Review</span>
              <div>
                <h2 className="font-headline text-4xl font-extrabold tracking-tight">{job.title}</h2>
                <p className="mt-2 text-lg font-semibold text-primary">{job.company}</p>
              </div>
              <p className="max-w-2xl text-base leading-8 text-on-surface-variant">
                {job.description}
              </p>
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-surface-container-low font-headline text-2xl font-extrabold text-primary">
              {job.companyInitials}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.2rem] bg-surface-container-low p-4">
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <Wallet className="h-4 w-4 text-primary" />
                Compensation
              </div>
              <p className="mt-3 font-headline text-2xl font-bold">{job.salaryLabel}</p>
            </div>
            <div className="rounded-[1.2rem] bg-surface-container-low p-4">
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <MapPin className="h-4 w-4 text-primary" />
                Location and Mode
              </div>
              <p className="mt-3 font-headline text-2xl font-bold">
                {job.location} - {job.mode}
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-surface-container-low p-4">
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <Building2 className="h-4 w-4 text-primary" />
                Role Type
              </div>
              <p className="mt-3 font-headline text-2xl font-bold">{job.type}</p>
            </div>
            <div className="rounded-[1.2rem] bg-surface-container-low p-4">
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <CalendarClock className="h-4 w-4 text-primary" />
                Application Deadline
              </div>
              <p className="mt-3 font-headline text-2xl font-bold">{job.deadline}</p>
            </div>
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <span className="section-label">Eligibility</span>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.2rem] bg-surface-container-low p-4">
                <p className="text-sm text-on-surface-variant">Minimum CGPA</p>
                <p className="mt-2 font-headline text-3xl font-extrabold">{job.minCgpa}</p>
              </div>
              <div className="rounded-[1.2rem] bg-surface-container-low p-4">
                <p className="text-sm text-on-surface-variant">Eligible branches</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.branches.map((branch) => (
                    <span
                      key={branch}
                      className="rounded-full bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-on-surface-variant"
                    >
                      {branch}
                    </span>
                  ))}
                </div>
              </div>
              {existingApplication ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-100 px-6 py-4 text-base font-semibold text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  Application submitted
                </div>
              ) : deadlinePassed ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-surface-container-low px-6 py-4 text-base font-semibold text-on-surface-variant">
                  <Lock className="h-5 w-5" />
                  Deadline passed — applications closed
                </div>
              ) : (
                <>
                  {/* Resume Picker */}
                  {showResumePicker && resumes.length > 0 && (
                    <div className="space-y-2 rounded-2xl border border-surface-container-low bg-surface-container-low/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">Select Resume</p>
                      {resumes.map((doc) => (
                        <label
                          key={doc.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors ${
                            (selectedDocId || primaryResume?.id) === doc.id
                              ? "bg-primary/10 ring-1 ring-primary"
                              : "hover:bg-surface-container-lowest"
                          }`}
                        >
                          <input
                            type="radio"
                            name="resumePick"
                            value={doc.id}
                            checked={(selectedDocId ?? primaryResume?.id) === doc.id}
                            onChange={() => setSelectedDocId(doc.id)}
                            className="accent-primary"
                          />
                          <FileText className="h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-on-surface">{doc.name}</p>
                            <p className="text-xs text-on-surface-variant">{doc.size} · {doc.updatedAt}</p>
                          </div>
                          {doc.primary && (
                            <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">Primary</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    disabled={isApplying || !job.eligible}
                    onClick={async () => {
                      if (resumes.length > 1 && !showResumePicker) {
                        setShowResumePicker(true);
                        return;
                      }
                      try {
                        const chosenDocId = selectedDocId || primaryResume?.id;
                        await applyToJob({ jobId: job.id, documentId: chosenDocId });
                        toast.success(`Applied to ${job.title} at ${job.company}.`);
                      } catch (applyError) {
                        const details = applyError?.response?.data?.details;
                        const message =
                          applyError?.response?.data?.error ||
                          (Array.isArray(details) ? details.join(", ") : null) ||
                          "Application could not be submitted.";
                        toast.error(message);
                      }
                    }}
                    size="lg"
                  >
                    {isApplying
                      ? "Submitting..."
                      : resumes.length > 1 && !showResumePicker
                      ? "Select Resume & Apply"
                      : "Apply with selected resume"}
                  </Button>
                </>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <span className="section-label">Process</span>
            <div className="mt-5 space-y-3">
              {job.process.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-[1.2rem] bg-surface-container-low p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest font-bold text-primary">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm text-on-surface-variant">{step}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SurfaceCard className="p-6 xl:col-span-2">
          <h3 className="font-headline text-2xl font-bold">Responsibilities</h3>
          <div className="mt-5 space-y-4">
            {job.responsibilities.map((item) => (
              <div key={item} className="flex gap-3 rounded-[1.2rem] bg-surface-container-low p-4">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-7 text-on-surface-variant">{item}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h3 className="font-headline text-2xl font-bold">Requirements</h3>
          <div className="mt-5 space-y-3">
            {job.requirements.map((item) => (
              <div key={item} className="rounded-[1.2rem] bg-surface-container-low p-4">
                <p className="text-sm leading-7 text-on-surface-variant">{item}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <SurfaceCard className="p-6">
          <h3 className="font-headline text-2xl font-bold">About the company</h3>
          <p className="mt-5 text-sm leading-8 text-on-surface-variant">{job.aboutCompany}</p>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h3 className="font-headline text-2xl font-bold">Perks and signals</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {job.perks.map((perk) => (
              <span
                key={perk}
                className="rounded-full bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant"
              >
                {perk}
              </span>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
