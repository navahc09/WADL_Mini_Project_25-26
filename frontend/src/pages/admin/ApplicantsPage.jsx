import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ExternalLink, Search } from "lucide-react";
import { useParams } from "react-router-dom";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import InterviewModal from "../../components/InterviewModal";
import Button from "../../components/ui/Button";
import SectionHeading from "../../components/ui/SectionHeading";
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
  const {
    data: applicants = [],
    isLoading: applicantsLoading,
    isError,
    error,
  } = useAdminApplicants(id);
  const { mutateAsync: updateApplicantStatus, isPending } = useUpdateApplicantStatus(id);
  const { mutateAsync: exportApplicants, isPending: isExporting } = useExportApplicants();

  const job = jobs.find((entry) => entry.id === id);
  const [activeInterviewApp, setActiveInterviewApp] = useState(null); // { appId, name }

  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      const matchesStatus = status === "all" || applicant.status.toLowerCase() === status;
      const matchesQuery =
        !deferredQuery ||
        `${applicant.name} ${applicant.rollNumber}`
          .toLowerCase()
          .includes(deferredQuery.toLowerCase());

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
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading applicant review board</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Pulling candidate snapshots and job context from the backend.
        </p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Applicants unavailable</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load applicants right now."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        label="Applicants Review"
        title={`${job?.title || "Selected role"} - ${job?.company || "Recruiter"}`}
        description="Use snapshot-safe profile data to move students through shortlist decisions with cleaner recruiter reporting."
        action={
          <Button
            variant="secondary"
            disabled={!id || isExporting}
            onClick={async () => {
              try {
                const fileName = await exportApplicants(id);
                toast.success(`${fileName} downloaded successfully.`);
              } catch (mutationError) {
                const message =
                  mutationError?.response?.data?.error || "Excel export could not be generated.";
                toast.error(message);
              }
            }}
          >
            {isExporting ? "Exporting..." : "Export Excel"}
          </Button>
        }
      />

      <section className="page-section grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Applications", value: stats.total },
          { label: "Awaiting Review", value: stats.underReview },
          { label: "Shortlisted", value: stats.shortlisted },
          { label: "Offers", value: stats.offered },
        ].map((item) => (
          <SurfaceCard key={item.label} className="panel-hover p-6">
            <p className="text-sm text-on-surface-variant">{item.label}</p>
            <p className="mt-3 font-headline text-4xl font-extrabold">{item.value}</p>
          </SurfaceCard>
        ))}
      </section>

      <SurfaceCard className="page-section p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="interactive-strip flex items-center gap-3 rounded-full bg-surface-container-low px-4 py-3">
            <Search className="h-4 w-4 text-outline" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-outline md:w-80"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student name or roll number"
              value={query}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {["all", "under review", "shortlisted", "offered", "rejected"].map((value) => (
              <button
                key={value}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  status === value
                    ? "bg-primary text-white"
                    : "bg-surface-container-low text-on-surface-variant"
                }`}
                onClick={() => setStatus(value)}
                type="button"
              >
                {value === "all"
                  ? "All"
                  : value
                      .split(" ")
                      .map((word) => word[0].toUpperCase() + word.slice(1))
                      .join(" ")}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <div className="page-section grid gap-4">
        {filteredApplicants.map((applicant) => {
          const isShortlisted = applicant.status.toLowerCase() === "shortlisted";
          const isOffered = applicant.status.toLowerCase() === "offered";
          const isRejected = applicant.status.toLowerCase() === "rejected";

          async function setStatusForApplicant(nextStatus) {
            try {
              await updateApplicantStatus({ applicantId: applicant.id, status: nextStatus });
              toast.success(`${applicant.name} moved to ${nextStatus}.`);
            } catch (mutationError) {
              const message =
                mutationError?.response?.data?.error ||
                "Applicant status could not be updated right now.";
              toast.error(message);
            }
          }

          return (
            <SurfaceCard key={applicant.id} className="panel-hover p-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="font-headline text-2xl font-bold">{applicant.name}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {applicant.rollNumber} - {applicant.branch}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                    {applicant.note}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:min-w-[420px]">
                  <div className="rounded-[1.2rem] bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-outline">CGPA</p>
                    <p className="mt-2 text-sm font-semibold text-on-surface">{applicant.cgpa}</p>
                  </div>
                  <div className="rounded-[1.2rem] bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-outline">Score</p>
                    <p className="mt-2 text-sm font-semibold text-on-surface">
                      {applicant.score}/100
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <ApplicationStatusBadge status={applicant.status} />
                <div className="flex flex-wrap gap-3">
                  {/* View Resume (deadline-locked snapshot) */}
                  {applicant.resumeUrl && (
                    <Button
                      variant="ghost"
                      onClick={() => window.open(applicant.resumeUrl, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Resume (at deadline)
                    </Button>
                  )}

                  {/* Interview management for shortlisted */}
                  {isShortlisted && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setActiveInterviewApp({ appId: applicant.id, name: applicant.name })
                      }
                    >
                      Manage Interview
                    </Button>
                  )}

                  {!isRejected && !isOffered ? (
                    <Button
                      disabled={isPending}
                      variant={isShortlisted ? "secondary" : "primary"}
                      onClick={() =>
                        setStatusForApplicant(
                          isShortlisted ? "Under Review" : "Shortlisted",
                        )
                      }
                    >
                      {isShortlisted ? "Undo Shortlist" : "Shortlist"}
                    </Button>
                  ) : null}
                  {isShortlisted && !isOffered ? (
                    <Button
                      disabled={isPending}
                      onClick={() => setStatusForApplicant("Offered")}
                    >
                      Mark Offered
                    </Button>
                  ) : null}
                  {!isShortlisted && !isOffered && !isRejected ? (
                    <Button
                      disabled={isPending}
                      variant="ghost"
                      className="text-error hover:bg-error-container"
                      onClick={() => setStatusForApplicant("Rejected")}
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </div>

      {/* Interview Modal */}
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
