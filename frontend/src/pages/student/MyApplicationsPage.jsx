import { useDeferredValue, useMemo, useState } from "react";
import { Search, FileText, Lock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useApplications, useChangeApplicationResume } from "../../hooks/useApplications";
import { useDocuments } from "../../hooks/useStudent";

const statusTabs = ["all", "applied", "shortlisted", "interview", "offer"];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function MyApplicationsPage() {
  const navigate = useNavigate();
  const { data: allApplications = [], isLoading, isError, error } = useApplications("all");
  const { data: documents = [] } = useDocuments();
  const [resumePickAppId, setResumePickAppId] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const resumes = documents.filter((d) => d.type?.toLowerCase().includes("resume"));
  const changeResumeMutation = useChangeApplicationResume(resumePickAppId);

  const filteredApplications = useMemo(() => {
    return allApplications.filter((application) => {
      const matchesStatus = status === "all" || application.status === status;
      const matchesQuery =
        !deferredQuery ||
        `${application.company} ${application.role}`
          .toLowerCase()
          .includes(deferredQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [allApplications, deferredQuery, status]);

  const stats = useMemo(() => {
    const interviews = allApplications.filter((item) => item.status === "interview").length;
    const offers = allApplications.filter((item) => item.status === "offer").length;
    const shortlisted = allApplications.filter((item) =>
      ["shortlisted", "interview", "offer"].includes(item.status),
    ).length;
    return {
      total: allApplications.length,
      interviews,
      offers,
      shortlistRate: allApplications.length
        ? `${Math.round((shortlisted / allApplications.length) * 100)}%`
        : "0%",
    };
  }, [allApplications]);

  if (isLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading applications…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Fetching your application history.</p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Applications unavailable</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load applications right now."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat row */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-3">
        {[
          { label: "Applied", value: stats.total },
          { label: "Interviewing", value: stats.interviews },
          { label: "Offers", value: stats.offers },
          { label: "Shortlist Rate", value: stats.shortlistRate },
        ].map((item) => (
          <motion.div key={item.label} variants={fadeUp}>
            <SurfaceCard className="p-4">
              <p className="text-xs text-on-surface-variant">{item.label}</p>
              <p className="mt-1 font-headline text-2xl font-extrabold">{item.value}</p>
            </SurfaceCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <SurfaceCard className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  status === tab
                    ? "bg-primary text-white"
                    : "bg-surface-container-low text-on-surface-variant"
                }`}
                onClick={() => setStatus(tab)}
                type="button"
              >
                {tab === "all" ? "All" : tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-2">
            <Search className="h-3.5 w-3.5 text-outline" />
            <input
              className="bg-transparent text-sm outline-none placeholder:text-outline md:w-56"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company or role"
              value={query}
            />
          </label>
        </div>
      </SurfaceCard>

      {/* Application list */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
        {filteredApplications.map((application) => (
          <motion.div key={application.id} variants={fadeUp}>
            <SurfaceCard className="p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">{application.role}</p>
                  <p className="text-xs font-medium text-primary">{application.company}</p>
                  {application.phase && (
                    <p className="mt-1 text-xs text-on-surface-variant">{application.phase}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 xl:shrink-0">
                  {[
                    { label: "Applied", value: application.appliedOn },
                    { label: "Match", value: `${application.matchScore}%` },
                    { label: "CTC", value: application.salary },
                  ].map((cell) => (
                    <div key={cell.label} className="rounded-xl bg-surface-container-low px-3 py-2 text-center min-w-[72px]">
                      <p className="text-[10px] uppercase tracking-wide text-outline">{cell.label}</p>
                      <p className="mt-0.5 text-xs font-semibold text-on-surface">{cell.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <ApplicationStatusBadge status={application.status} />
                  <span className="text-xs text-on-surface-variant">
                    Updated {application.lastUpdated}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/student/applications/${application.id}`)}
                    className="flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    View Details <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(application.timeline || []).map((step) => (
                    <span
                      key={step.label}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        step.done
                          ? "bg-primary-fixed text-on-primary-fixed-variant"
                          : "bg-surface-container-low text-on-surface-variant"
                      }`}
                    >
                      {step.label}: {step.date}
                    </span>
                  ))}
                </div>
              </div>

              {/* Resume change */}
              {(() => {
                const deadlinePassed = application.deadline
                  ? new Date(application.deadline) < new Date()
                  : true;

                if (deadlinePassed) {
                  return (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-container-low/60 px-3 py-2 text-xs text-on-surface-variant">
                      <Lock className="h-3.5 w-3.5 shrink-0 text-outline" />
                      <span>Deadline passed — resume locked</span>
                    </div>
                  );
                }

                if (resumePickAppId === application.id) {
                  return (
                    <div className="mt-3 space-y-2 rounded-xl border border-primary/20 bg-surface-container-low/50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-outline">Change Resume</p>
                      {resumes.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex cursor-pointer items-center gap-2 rounded-xl p-1.5 hover:bg-surface-container-lowest"
                        >
                          <input
                            type="radio"
                            name={`resumePick-${application.id}`}
                            value={doc.id}
                            className="accent-primary"
                            onChange={() => setSelectedDocId(doc.id)}
                          />
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm font-medium text-on-surface">{doc.name}</span>
                          {doc.primary && (
                            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">Primary</span>
                          )}
                        </label>
                      ))}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={changeResumeMutation.isPending || !selectedDocId}
                          onClick={async () => {
                            try {
                              await changeResumeMutation.mutateAsync(selectedDocId);
                              toast.success("Resume updated.");
                              setResumePickAppId(null);
                              setSelectedDocId(null);
                            } catch (err) {
                              toast.error(err?.response?.data?.error || "Could not update resume.");
                            }
                          }}
                          className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => { setResumePickAppId(null); setSelectedDocId(null); }}
                          className="rounded-xl bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={() => { setResumePickAppId(application.id); setSelectedDocId(null); }}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" /> Change resume before deadline
                  </button>
                );
              })()}
            </SurfaceCard>
          </motion.div>
        ))}

        {filteredApplications.length === 0 && (
          <SurfaceCard className="p-6 text-center">
            <p className="font-headline text-base font-bold text-on-surface">No applications found</p>
            <p className="mt-1 text-sm text-on-surface-variant">Try changing the filter or search term.</p>
          </SurfaceCard>
        )}
      </motion.div>
    </div>
  );
}
