import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Wallet,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import { useApplication } from "../../hooks/useApplications";
import { useDocuments } from "../../hooks/useStudent";

const STATUS_STEPS = [
  { key: "applied", label: "Applied" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
];

function stepReached(currentStatus, stepKey) {
  const order = ["applied", "shortlisted", "interview", "offer"];
  const currentIdx = order.indexOf(currentStatus);
  const stepIdx = order.indexOf(stepKey);
  return stepIdx <= currentIdx;
}

function StatusBreadcrumb({ status }) {
  const isRejected = status === "rejected";

  return (
    <div className="relative flex items-center gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const reached = !isRejected && stepReached(status, step.key);
        const isCurrent = status === step.key || (step.key === "applied" && status === "applied");
        const isLast = idx === STATUS_STEPS.length - 1;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  reached
                    ? "border-primary bg-primary text-white"
                    : "border-outline bg-surface-container-low text-outline"
                }`}
              >
                {reached ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <p
                className={`whitespace-nowrap text-[10px] font-semibold ${
                  reached ? "text-primary" : "text-on-surface-variant"
                } ${isCurrent ? "font-bold" : ""}`}
              >
                {step.label}
              </p>
            </div>
            {!isLast && (
              <div
                className={`mb-4 h-0.5 w-12 transition-colors sm:w-16 ${
                  reached && stepReached(status, STATUS_STEPS[idx + 1].key)
                    ? "bg-primary"
                    : "bg-outline-variant/40"
                }`}
              />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="ml-3 rounded-full bg-error-container px-3 py-1 text-xs font-bold text-on-error-container">
          Rejected
        </div>
      )}
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const { data: application, isLoading, isError, error } = useApplication(id);
  const { data: documents = [] } = useDocuments();

  if (isLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading application…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Fetching your application details.</p>
      </SurfaceCard>
    );
  }

  if (isError || !application) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Application not found</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "Could not load this application."}
        </p>
        <Link className="mt-3 inline-flex" to="/student/applications">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
          </Button>
        </Link>
      </SurfaceCard>
    );
  }

  const attachedDoc = documents.find((d) => d.id === application.documentId);
  const resumeName = attachedDoc?.name || application.resumeFileName || null;

  return (
    <div className="space-y-4">
      <Link className="inline-flex" to="/student/applications">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
        </Button>
      </Link>

      {/* Status breadcrumb */}
      <SurfaceCard className="p-5">
        <p className="section-label mb-3">Application Progress</p>
        <div className="overflow-x-auto pb-1">
          <StatusBreadcrumb status={application.status} />
        </div>
        {application.phase && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-3">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm font-medium text-on-surface">{application.phase}</p>
          </div>
        )}
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Left — main details */}
        <div className="space-y-4">
          {/* Job info */}
          <SurfaceCard className="p-5">
            <p className="section-label">Application Details</p>
            <div className="mt-3">
              <h2 className="font-headline text-2xl font-extrabold">{application.role}</h2>
              <p className="mt-0.5 font-semibold text-primary">{application.company}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { icon: CalendarClock, label: "Applied On", value: application.appliedOn },
                { icon: Wallet, label: "CTC", value: application.salary },
                { icon: Building2, label: "Last Update", value: application.lastUpdated },
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

          {/* Interview rounds */}
          {(application.rounds || []).length > 0 && (
            <SurfaceCard className="p-5">
              <p className="section-label">Interview Rounds</p>
              <div className="mt-3 space-y-2">
                {application.rounds.map((round, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-lowest font-headline text-xs font-bold text-primary">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold capitalize text-on-surface">
                          {round.type?.replace(/_/g, " ") || "Interview"}
                        </p>
                        {round.scheduledAt && (
                          <p className="text-xs text-on-surface-variant">{round.scheduledAt}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        round.result === "pass"
                          ? "bg-emerald-100 text-emerald-700"
                          : round.result === "fail"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {round.result || "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* Snapshot skills */}
          {(application.snapshot?.skills || []).length > 0 && (
            <SurfaceCard className="p-5">
              <p className="section-label">Snapshot at Time of Application</p>
              <div className="mt-3 space-y-3">
                {application.snapshot.cgpa && (
                  <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">CGPA</p>
                    <p className="font-headline text-lg font-extrabold text-primary">
                      {application.snapshot.cgpa}
                    </p>
                  </div>
                )}
                <div>
                  <p className="mb-2 text-xs font-semibold text-on-surface-variant">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {application.snapshot.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </SurfaceCard>
          )}
        </div>

        {/* Right — status + resume */}
        <div className="space-y-4">
          <SurfaceCard className="p-5">
            <p className="section-label">Current Status</p>
            <div className="mt-3 flex items-center gap-3">
              <ApplicationStatusBadge status={application.status} />
            </div>
            {/* Full timeline */}
            <div className="mt-4 space-y-2">
              {(application.timeline || []).map((step) => (
                <div
                  key={step.label}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${
                    step.done
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {step.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-outline" />
                    )}
                    {step.label}
                  </div>
                  <span className="text-xs">{step.date}</span>
                </div>
              ))}
            </div>
          </SurfaceCard>

          {/* Resume used */}
          <SurfaceCard className="p-5">
            <p className="section-label">Resume Attached</p>
            <div className="mt-3">
              {resumeName ? (
                <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                  <div className="rounded-xl bg-surface-container-lowest p-2.5 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-on-surface">{resumeName}</p>
                    {attachedDoc && (
                      <p className="text-xs text-on-surface-variant">
                        {attachedDoc.size} · {attachedDoc.updatedAt}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">No resume attached to this application.</p>
              )}
            </div>
            <p className="mt-3 text-[10px] leading-4 text-outline">
              The resume attached at the time of submission is fixed for this application. You can
              update it from the applications list before the deadline.
            </p>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
