import { useDeferredValue, useMemo, useState } from "react";
import { Search, FileText, CheckCircle, XCircle, Lock } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import SectionHeading from "../../components/ui/SectionHeading";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useApplications, useChangeApplicationResume } from "../../hooks/useApplications";
import { useDocuments } from "../../hooks/useStudent";

const statusTabs = ["all", "applied", "shortlisted", "interview", "offer"];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function MyApplicationsPage() {
  const { data: allApplications = [], isLoading, isError, error } = useApplications("all");
  const { data: documents = [] } = useDocuments();
  const [resumePickAppId, setResumePickAppId] = useState(null);
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
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading applications</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Fetching snapshot-safe application history from the backend.
        </p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Applications unavailable</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load applications right now."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        label="Application Hub"
        title="Track every active application"
        description="A single board for recruiter response, interview movement, and the quality of your current funnel."
      />

      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-4"
      >
        {[
          { label: "Total Applied", value: stats.total },
          { label: "Interviewing", value: stats.interviews },
          { label: "Offers", value: stats.offers },
          { label: "Shortlist Rate", value: stats.shortlistRate },
        ].map((item) => (
          <motion.div key={item.label} variants={fadeUp}>
            <SurfaceCard className="p-6 h-full">
              <p className="text-sm text-on-surface-variant">{item.label}</p>
              <p className="mt-3 font-headline text-4xl font-extrabold">{item.value}</p>
            </SurfaceCard>
          </motion.div>
        ))}
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
      >
        <SurfaceCard className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    status === tab
                      ? "bg-primary text-white"
                      : "bg-surface-container-low text-on-surface-variant"
                  }`}
                  onClick={() => setStatus(tab)}
                  type="button"
                >
                  {tab === "all" ? "All Applications" : tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-3 rounded-full bg-surface-container-low px-4 py-3">
              <Search className="h-4 w-4 text-outline" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-outline md:w-72"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by company or role"
                value={query}
              />
            </label>
          </div>
        </SurfaceCard>
      </motion.div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid gap-4"
      >
        {filteredApplications.map((application) => (
          <motion.div key={application.id} variants={fadeUp}>
            <SurfaceCard className="p-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="font-headline text-2xl font-bold">{application.role}</p>
                  <p className="mt-1 text-sm font-medium text-primary">{application.company}</p>
                  <p className="mt-3 text-sm text-on-surface-variant">{application.phase}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3 xl:min-w-[520px]">
                  <div className="rounded-[1.2rem] bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-outline">Applied</p>
                    <p className="mt-2 text-sm font-semibold text-on-surface">
                      {application.appliedOn}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-outline">Match Score</p>
                    <p className="mt-2 text-sm font-semibold text-on-surface">
                      {application.matchScore}%
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-outline">Compensation</p>
                    <p className="mt-2 text-sm font-semibold text-on-surface">
                      {application.salary}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <ApplicationStatusBadge status={application.status} />
                  <span className="text-sm text-on-surface-variant">
                    Last updated {application.lastUpdated}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {application.timeline.map((step) => (
                    <div
                      key={step.label}
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        step.done
                          ? "bg-primary-fixed text-on-primary-fixed-variant"
                          : "bg-surface-container-low text-on-surface-variant"
                      }`}
                    >
                      {step.label}: {step.date}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resume change section */}
              {(() => {
                const deadlinePassed = application.deadline
                  ? new Date(application.deadline) < new Date()
                  : true;

                if (deadlinePassed) {
                  return (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-container-low/60 px-4 py-2.5 text-sm text-on-surface-variant">
                      <Lock className="h-4 w-4 shrink-0 text-outline" />
                      <span>Deadline passed — resume locked 🔒</span>
                    </div>
                  );
                }

                if (resumePickAppId === application.id) {
                  return (
                    <div className="mt-4 space-y-3 rounded-2xl border border-primary/20 bg-surface-container-low/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">Change Resume</p>
                      {resumes.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-surface-container-lowest"
                        >
                          <input
                            type="radio"
                            name={`resumePick-${application.id}`}
                            value={doc.id}
                            className="accent-primary"
                            onChange={() => setSelectedDocId(doc.id)}
                          />
                          <FileText className="h-4 w-4 text-primary" />
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
                              toast.success("Resume updated for this application.");
                              setResumePickAppId(null);
                              setSelectedDocId(null);
                            } catch (err) {
                              toast.error(err?.response?.data?.error || "Could not update resume.");
                            }
                          }}
                          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Confirm Change
                        </button>
                        <button
                          type="button"
                          onClick={() => { setResumePickAppId(null); setSelectedDocId(null); }}
                          className="rounded-xl bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant"
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
                    className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" /> Change resume before deadline
                  </button>
                );
              })()}
            </SurfaceCard>

          </motion.div>
        ))}

        {filteredApplications.length === 0 && (
          <motion.div variants={fadeUp}>
            <SurfaceCard className="p-10 text-center">
              <p className="font-headline text-xl font-bold text-on-surface">No applications found</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Try changing the filter or search term.
              </p>
            </SurfaceCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
