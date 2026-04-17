import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle2, ClipboardList, ExternalLink, Search, Settings, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import InterviewModal from "../../components/InterviewModal";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import {
  useAdminApplicants,
  useAdminJobs,
  useAuditLogs,
  useExportApplicants,
  useUpdateApplicantStatus,
} from "../../hooks/useAdmin";

// ── Reason Modal ──────────────────────────────────────────────────────────────
function StatusChangeModal({ applicant, targetStatus, onConfirm, onCancel, isPending }) {
  const [reason, setReason] = useState("");
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-[1.4rem] bg-surface-container-lowest p-6 shadow-2xl"
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-headline text-base font-bold">Confirm Status Change</h3>
          <button onClick={onCancel} className="rounded-full p-1 hover:bg-surface-container-low">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-on-surface-variant mb-4">
          Move <span className="font-semibold text-on-surface">{applicant.name}</span> to{" "}
          <span className="font-semibold text-primary">{targetStatus}</span>?
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-on-surface-variant">
            Reason <span className="text-outline">(optional — stored in audit trail)</span>
          </label>
          <textarea
            className="field-shell min-h-16 w-full resize-none text-sm"
            placeholder="e.g. CGPA meets requirement, strong DSA skills on resume…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex gap-2 pt-3">
          <Button size="sm" disabled={isPending} onClick={() => onConfirm(reason)}>
            {isPending ? "Updating…" : "Confirm"}
          </Button>
          <Button size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Audit Log Drawer ──────────────────────────────────────────────────────────
function AuditLogDrawer({ applicationId, applicantName, onClose }) {
  const { data: logs = [], isLoading } = useAuditLogs({ entityType: "application", entityId: applicationId });

  const ACTION_LABELS = {
    status_changed: "Status changed",
    round_result_set: "Round result set",
    resume_changed: "Resume changed",
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 sm:items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-lg rounded-[1.4rem] bg-surface-container-lowest p-5 shadow-2xl"
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Audit Trail</p>
            <h3 className="font-headline text-base font-bold">{applicantName}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-surface-container-low">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">Loading audit trail…</p>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <ClipboardList className="h-8 w-8 text-outline" />
            <p className="text-sm font-semibold text-on-surface">No audit trail yet</p>
            <p className="text-xs text-on-surface-variant">Status changes will be recorded here.</p>
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl bg-surface-container-low p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface">
                      {ACTION_LABELS[log.action] || log.action.replace(/_/g, " ")}
                    </p>
                    {log.old_value?.status && log.new_value?.status && (
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        <span className="text-error">{log.old_value.status}</span>
                        {" → "}
                        <span className="text-primary">{log.new_value.status}</span>
                      </p>
                    )}
                    {log.reason && (
                      <p className="mt-1 text-xs italic text-on-surface-variant">"{log.reason}"</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-outline">
                      {new Date(log.changed_at).toLocaleString()} · {log.changed_by_name || "System"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApplicantsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [eligibilityTab, setEligibilityTab] = useState("all"); // all | eligible | ineligible
  const deferredQuery = useDeferredValue(query);

  const { data: jobs = [], isLoading: jobsLoading } = useAdminJobs();
  const { data: applicants = [], isLoading: applicantsLoading, isError, error } = useAdminApplicants(id);
  const { mutateAsync: updateApplicantStatus, isPending } = useUpdateApplicantStatus(id);
  const { mutateAsync: exportApplicants, isPending: isExporting } = useExportApplicants();

  const job = jobs.find((entry) => entry.id === id);
  const [activeInterviewApp, setActiveInterviewApp] = useState(null);

  // Pending status change
  const [pendingChange, setPendingChange] = useState(null); // { applicant, targetStatus }
  // Audit log drawer
  const [auditApp, setAuditApp] = useState(null); // { id, name }

  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      const matchesStatus = status === "all" || applicant.status.toLowerCase() === status;
      const matchesQuery =
        !deferredQuery ||
        `${applicant.name} ${applicant.rollNumber}`.toLowerCase().includes(deferredQuery.toLowerCase());
      const matchesEligibility =
        eligibilityTab === "all" ||
        (eligibilityTab === "eligible" ? applicant.eligible !== false : applicant.eligible === false);
      return matchesStatus && matchesQuery && matchesEligibility;
    });
  }, [applicants, deferredQuery, status, eligibilityTab]);

  const stats = useMemo(() => {
    const shortlisted = applicants.filter((item) => item.status === "Shortlisted").length;
    const offered = applicants.filter((item) => item.status === "Offered").length;
    const rejected = applicants.filter((item) => item.status === "Rejected").length;
    const eligible = applicants.filter((item) => item.eligible !== false).length;
    const ineligible = applicants.filter((item) => item.eligible === false).length;
    return {
      total: applicants.length,
      eligible,
      ineligible,
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

  function requestStatusChange(applicant, targetStatus) {
    setPendingChange({ applicant, targetStatus });
  }

  async function confirmStatusChange(reason) {
    if (!pendingChange) return;
    const { applicant, targetStatus } = pendingChange;
    setPendingChange(null);
    try {
      await updateApplicantStatus({ applicantId: applicant.id, status: targetStatus, reason });
      toast.success(`${applicant.name} moved to ${targetStatus}.`);
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="sm"
            disabled={!job?.companyId}
            onClick={() => navigate(`/admin/companies/${job?.companyId}/export-template`)}
            title="Configure branded export template for this company"
          >
            <Settings className="h-3.5 w-3.5" />
            Template
          </Button>
          <Button
            variant="secondary" size="sm" disabled={!id || isExporting}
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {[
          { label: "Total", value: stats.total },
          { label: "Eligible", value: stats.eligible, highlight: true },
          { label: "Ineligible", value: stats.ineligible, warn: stats.ineligible > 0 },
          { label: "Shortlisted", value: stats.shortlisted },
          { label: "Offers", value: stats.offered },
        ].map((item) => (
          <SurfaceCard key={item.label} className="panel-hover p-4">
            <p className="text-xs text-on-surface-variant">{item.label}</p>
            <p className={`mt-1 font-headline text-2xl font-extrabold ${
              item.highlight ? "text-primary" : item.warn ? "text-error" : ""
            }`}>{item.value}</p>
          </SurfaceCard>
        ))}
      </div>

      {/* Eligibility tabs + filters */}
      <SurfaceCard className="p-3 space-y-2">
        {/* Eligibility segmented control */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mr-1">Eligibility:</span>
          {[
            { value: "all", label: "All" },
            { value: "eligible", label: "Hard-eligible only" },
            { value: "ineligible", label: "Did not pass hard filters" },
          ].map((tab) => (
            <button key={tab.value}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                eligibilityTab === tab.value
                  ? "bg-primary text-white"
                  : "bg-surface-container-low text-on-surface-variant"
              }`}
              onClick={() => setEligibilityTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
              <button key={value}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  status === value ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                }`}
                onClick={() => setStatus(value)} type="button"
              >
                {value === "all" ? "All" : value.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
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
          const isIneligible = applicant.eligible === false;

          return (
            <SurfaceCard key={applicant.id} className={`panel-hover p-4 ${isIneligible ? "opacity-75" : ""}`}>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-on-surface">{applicant.name}</p>
                    {isIneligible ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        <AlertTriangle className="h-3 w-3" /> Hard Filter Failed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Eligible
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {applicant.rollNumber} — {applicant.branch}
                  </p>
                  {isIneligible && applicant.hardFailures?.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {applicant.hardFailures.map((reason) => (
                        <p key={reason} className="flex items-start gap-1.5 text-xs text-red-600">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                          {reason}
                        </p>
                      ))}
                    </div>
                  )}
                  {!isIneligible && applicant.note && (
                    <p className="mt-1 text-xs leading-5 text-on-surface-variant line-clamp-2">{applicant.note}</p>
                  )}
                </div>

                <div className="flex gap-2 xl:shrink-0">
                  <div className="rounded-xl bg-surface-container-low px-3 py-2 text-center min-w-[72px]">
                    <p className="text-[10px] uppercase tracking-wide text-outline">CGPA</p>
                    <p className="mt-0.5 text-xs font-semibold text-on-surface">{applicant.cgpa}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low px-3 py-2 text-center min-w-[72px]">
                    <p className="text-[10px] uppercase tracking-wide text-outline">Fit Score</p>
                    <p className={`mt-0.5 text-xs font-semibold ${isIneligible ? "text-outline italic" : "text-on-surface"}`}>
                      {isIneligible ? "N/A" : `${applicant.score}/100`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <ApplicationStatusBadge status={applicant.status} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm"
                    onClick={() => setAuditApp({ id: applicant.id, name: applicant.name })}>
                    <ClipboardList className="h-3.5 w-3.5" /> Audit
                  </Button>
                  {applicant.resumeUrl && (
                    <Button variant="ghost" size="sm"
                      onClick={() => window.open(applicant.resumeUrl, "_blank", "noopener,noreferrer")}>
                      <ExternalLink className="h-3.5 w-3.5" /> Resume
                    </Button>
                  )}
                  {isShortlisted && (
                    <Button variant="secondary" size="sm"
                      onClick={() => setActiveInterviewApp({ appId: applicant.id, name: applicant.name })}>
                      Manage Interview
                    </Button>
                  )}
                  {!isRejected && !isOffered && (
                    <Button disabled={isPending} size="sm"
                      variant={isShortlisted ? "secondary" : "primary"}
                      onClick={() => requestStatusChange(applicant, isShortlisted ? "Under Review" : "Shortlisted")}>
                      {isShortlisted ? "Undo Shortlist" : "Shortlist"}
                    </Button>
                  )}
                  {isShortlisted && !isOffered && (
                    <Button disabled={isPending} size="sm"
                      onClick={() => requestStatusChange(applicant, "Offered")}>
                      Mark Offered
                    </Button>
                  )}
                  {!isShortlisted && !isOffered && !isRejected && (
                    <Button disabled={isPending} size="sm" variant="ghost"
                      className="text-error hover:bg-error-container"
                      onClick={() => requestStatusChange(applicant, "Rejected")}>
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

      {/* Modals */}
      <AnimatePresence>
        {pendingChange && (
          <StatusChangeModal
            applicant={pendingChange.applicant}
            targetStatus={pendingChange.targetStatus}
            onConfirm={confirmStatusChange}
            onCancel={() => setPendingChange(null)}
            isPending={isPending}
          />
        )}
        {auditApp && (
          <AuditLogDrawer
            applicationId={auditApp.id}
            applicantName={auditApp.name}
            onClose={() => setAuditApp(null)}
          />
        )}
      </AnimatePresence>

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
