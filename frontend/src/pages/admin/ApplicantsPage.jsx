import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ExternalLink, Search } from "lucide-react";
import { useParams } from "react-router-dom";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import InterviewModal from "../../components/InterviewModal";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import {
  useAdminApplicants,
  useAdminJobs,
  useExportApplicants,
  useUpdateApplicantStatus,
} from "../../hooks/useAdmin";

export default function ApplicantsPage() {
  const { id } = useParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const { data: jobs = [], isLoading: jobsLoading } = useAdminJobs();
  const { data: applicants = [], isLoading: applicantsLoading, isError, error } = useAdminApplicants(id);
  const { mutateAsync: updateApplicantStatus, isPending } = useUpdateApplicantStatus(id);
  const { mutateAsync: exportApplicants, isPending: isExporting } = useExportApplicants();

  const job = jobs.find((entry) => entry.id === id);
  const [activeInterviewApp, setActiveInterviewApp] = useState(null);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      const matchesStatus = status === "all" || applicant.status.toLowerCase() === status;
      const matchesQuery =
        !deferredQuery ||
        `${applicant.name} ${applicant.rollNumber}`.toLowerCase().includes(deferredQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [applicants, deferredQuery, status]);

  const stats = useMemo(() => {
    const shortlisted = applicants.filter((item) => item.status === "Shortlisted").length;
    const offered = applicants.filter((item) => item.status === "Offered").length;
    const rejected = applicants.filter((item) => item.status === "Rejected").length;
    const underReview = applicants.filter((item) => item.status === "Under Review").length;
    return {
      total: applicants.length,
      underReview,
      shortlisted,
      offered,
      rejectionRate: applicants.length ? `${Math.round((rejected / applicants.length) * 100)}%` : "0%",
    };
  }, [applicants]);

  if (jobsLoading || applicantsLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading applicant board…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Pulling candidate snapshots.</p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Applicants unavailable</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "Could not load applicants right now."}
        </p>
      </SurfaceCard>
    );
  }

  async function setStatusForApplicant(applicant, nextStatus) {
    try {
      await updateApplicantStatus({ applicantId: applicant.id, status: nextStatus });
      toast.success(`${applicant.name} moved to ${nextStatus}.`);
    } catch (mutationError) {
      toast.error(mutationError?.response?.data?.error || "Status update failed.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Applicants Review</p>
          <h2 className="font-headline text-lg font-bold">{job?.title || "Selected role"} — {job?.company || "Recruiter"}</h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={!id || isExporting}
          onClick={async () => {
            try {
              const fileName = await exportApplicants(id);
              toast.success(`${fileName} downloaded.`);
            } catch (mutationError) {
              toast.error(mutationError?.response?.data?.error || "Export failed.");
            }
          }}
        >
          {isExporting ? "Exporting…" : "Export Excel"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Awaiting Review", value: stats.underReview },
          { label: "Shortlisted", value: stats.shortlisted },
          { label: "Offers", value: stats.offered },
        ].map((item) => (
          <SurfaceCard key={item.label} className="panel-hover p-4">
            <p className="text-xs text-on-surface-variant">{item.label}</p>
            <p className="mt-1 font-headline text-2xl font-extrabold">{item.value}</p>
          </SurfaceCard>
        ))}
      </div>

      {/* Filters */}
      <SurfaceCard className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-2">
            <Search className="h-3.5 w-3.5 text-outline" />
            <input
              className="bg-transparent text-sm outline-none placeholder:text-outline md:w-64"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student name or roll number"
              value={query}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {["all", "under review", "shortlisted", "offered", "rejected"].map((value) => (
              <button
                key={value}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  status === value
                    ? "bg-primary text-white"
                    : "bg-surface-container-low text-on-surface-variant"
                }`}
                onClick={() => setStatus(value)}
                type="button"
              >
                {value === "all"
                  ? "All"
                  : value.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      {/* Applicant cards */}
      <div className="space-y-3">
        {filteredApplicants.map((applicant) => {
          const isShortlisted = applicant.status.toLowerCase() === "shortlisted";
          const isOffered = applicant.status.toLowerCase() === "offered";
          const isRejected = applicant.status.toLowerCase() === "rejected";

          return (
            <SurfaceCard key={applicant.id} className="panel-hover p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">{applicant.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {applicant.rollNumber} — {applicant.branch}
                  </p>
                  {applicant.note && (
                    <p className="mt-1 text-xs leading-5 text-on-surface-variant line-clamp-2">{applicant.note}</p>
                  )}
                </div>

                <div className="flex gap-2 xl:shrink-0">
                  {[
                    { label: "CGPA", value: applicant.cgpa },
                    { label: "Score", value: `${applicant.score}/100` },
                  ].map((cell) => (
                    <div key={cell.label} className="rounded-xl bg-surface-container-low px-3 py-2 text-center min-w-[72px]">
                      <p className="text-[10px] uppercase tracking-wide text-outline">{cell.label}</p>
                      <p className="mt-0.5 text-xs font-semibold text-on-surface">{cell.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <ApplicationStatusBadge status={applicant.status} />
                <div className="flex flex-wrap gap-2">
                  {applicant.resumeUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(applicant.resumeUrl, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Resume
                    </Button>
                  )}
                  {isShortlisted && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveInterviewApp({ appId: applicant.id, name: applicant.name })}
                    >
                      Manage Interview
                    </Button>
                  )}
                  {!isRejected && !isOffered && (
                    <Button
                      disabled={isPending}
                      size="sm"
                      variant={isShortlisted ? "secondary" : "primary"}
                      onClick={() => setStatusForApplicant(applicant, isShortlisted ? "Under Review" : "Shortlisted")}
                    >
                      {isShortlisted ? "Undo Shortlist" : "Shortlist"}
                    </Button>
                  )}
                  {isShortlisted && !isOffered && (
                    <Button
                      disabled={isPending}
                      size="sm"
                      onClick={() => setStatusForApplicant(applicant, "Offered")}
                    >
                      Mark Offered
                    </Button>
                  )}
                  {!isShortlisted && !isOffered && !isRejected && (
                    <Button
                      disabled={isPending}
                      size="sm"
                      variant="ghost"
                      className="text-error hover:bg-error-container"
                      onClick={() => setStatusForApplicant(applicant, "Rejected")}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </SurfaceCard>
          );
        })}

        {filteredApplicants.length === 0 && (
          <SurfaceCard className="p-6 text-center">
            <p className="text-sm text-on-surface-variant">No applicants match the current filter.</p>
          </SurfaceCard>
        )}
      </div>

      {activeInterviewApp && (
        <InterviewModal
          appId={activeInterviewApp.appId}
          applicantName={activeInterviewApp.name}
          onClose={() => setActiveInterviewApp(null)}
        />
      )}
    </div>
  );
}
