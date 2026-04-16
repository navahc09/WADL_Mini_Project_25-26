import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import {
  useAdminJob,
  useAdminJobs,
  useCloseJob,
  useDeleteJob,
  useReopenJob,
  useUpdateJob,
} from "../../hooks/useAdmin";

function joinList(values = []) {
  return Array.isArray(values) ? values.join("\n") : values || "";
}

export default function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const { isLoading: jobsLoading } = useAdminJobs();
  const job = useAdminJob(id);

  const { mutateAsync: updateJob, isPending: isUpdating } = useUpdateJob(id);
  const { mutateAsync: closeJob, isPending: isClosing } = useCloseJob();
  const { mutateAsync: reopenJob, isPending: isReopening } = useReopenJob();
  const { mutateAsync: deleteJob, isPending: isDeleting } = useDeleteJob();

  const [showDanger, setShowDanger] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { register, reset, handleSubmit } = useForm({
    defaultValues: {
      company: "", title: "", type: "", mode: "", location: "",
      salaryLabel: "", minCgpa: "", maxActiveBacklogs: "",
      branches: "", skills: "", deadline: "", description: "",
      aboutCompany: "", responsibilities: "", requirements: "", perks: "", process: "",
    },
  });

  useEffect(() => {
    if (!job) return;
    reset({
      company: job.company || "",
      title: job.title || "",
      type: job.type || "",
      mode: job.mode || "",
      location: job.location || "",
      salaryLabel: job.salaryLabel || "",
      minCgpa: job.minCgpa || "",
      maxActiveBacklogs: job.maxActiveBacklogs ?? "",
      branches: (job.branches || []).join(", "),
      skills: (job.tags || []).join(", "),
      deadline: job.deadlineRaw || "",
      description: job.description || "",
      aboutCompany: job.aboutCompany || "",
      responsibilities: joinList(job.responsibilities),
      requirements: joinList(job.requirements),
      perks: joinList(job.perks),
      process: joinList(job.process),
    });
  }, [job, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateJob({
        ...values,
        minCgpa: Number(values.minCgpa),
        maxActiveBacklogs: Number(values.maxActiveBacklogs ?? 0),
      });
      toast.success("Job updated successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Update failed.");
    }
  });

  if (jobsLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading job data…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Fetching current job details.</p>
      </SurfaceCard>
    );
  }

  if (!job) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Job not found</h2>
        <Link to="/admin/jobs">
          <Button variant="secondary" size="sm" className="mt-3">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Jobs
          </Button>
        </Link>
      </SurfaceCard>
    );
  }

  const isClosed = job.status === "Closed";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Edit Job</p>
            <h2 className="font-headline text-lg font-bold">{job.company} — {job.title}</h2>
          </div>
        </div>
        <Button
          size="sm"
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={isUpdating || isClosed}
        >
          {isUpdating ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
          ) : (
            <><CheckCircle2 className="h-3.5 w-3.5" /> Save Changes</>
          )}
        </Button>
      </div>

      {isClosed && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Lock className="h-4 w-4 shrink-0 text-amber-500" />
          This job is <strong>closed</strong>. Reopen it to allow edits.
        </div>
      )}

      <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
        {/* Role Identity */}
        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Role Identity</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {[
              { label: "Company", key: "company" },
              { label: "Job Title", key: "title" },
              { label: "Location", key: "location" },
            ].map(({ label, key }) => (
              <label key={key} className="space-y-1 text-sm">
                <span className="ml-1 block text-xs text-on-surface-variant">{label}</span>
                <input className="field-shell w-full" disabled={isClosed} {...register(key)} />
              </label>
            ))}
            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Job Type</span>
              <select className="field-shell w-full" disabled={isClosed} {...register("type")}>
                <option value="">Select type</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Work Mode</span>
              <select className="field-shell w-full" disabled={isClosed} {...register("mode")}>
                <option value="">Select mode</option>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Salary Label</span>
              <input className="field-shell w-full" disabled={isClosed} {...register("salaryLabel")} />
            </label>
          </div>
        </SurfaceCard>

        {/* Eligibility + Description side by side */}
        <div className="grid gap-3 xl:grid-cols-2">
          <SurfaceCard className="p-4">
            <h3 className="font-semibold text-on-surface">Eligibility</h3>
            <div className="mt-3 space-y-3">
              {[
                { label: "Min CGPA", key: "minCgpa", type: "number", step: "0.01" },
                { label: "Max Active Backlogs", key: "maxActiveBacklogs", type: "number", min: "0" },
              ].map(({ label, key, ...inputProps }) => (
                <label key={key} className="space-y-1 text-sm">
                  <span className="ml-1 block text-xs text-on-surface-variant">{label}</span>
                  <input className="field-shell w-full" disabled={isClosed} {...inputProps} {...register(key)} />
                </label>
              ))}
              <label className="space-y-1 text-sm">
                <span className="ml-1 block text-xs text-on-surface-variant">Eligible Branches (comma-separated)</span>
                <input className="field-shell w-full" disabled={isClosed} {...register("branches")} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="ml-1 block text-xs text-on-surface-variant">Required Skills (comma-separated)</span>
                <input className="field-shell w-full" disabled={isClosed} {...register("skills")} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="ml-1 block text-xs text-on-surface-variant">Application Deadline</span>
                <input className="field-shell w-full" type="date" disabled={isClosed} {...register("deadline")} />
              </label>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-4">
            <h3 className="font-semibold text-on-surface">Description</h3>
            <div className="mt-3 space-y-3">
              <label className="space-y-1 text-sm">
                <span className="ml-1 block text-xs text-on-surface-variant">Job Description</span>
                <textarea className="field-shell min-h-20 w-full resize-none" disabled={isClosed} {...register("description")} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="ml-1 block text-xs text-on-surface-variant">About Company</span>
                <textarea className="field-shell min-h-20 w-full resize-none" disabled={isClosed} {...register("aboutCompany")} />
              </label>
            </div>
          </SurfaceCard>
        </div>

        {/* Lists */}
        <div className="grid gap-3 xl:grid-cols-2">
          {[
            { label: "Responsibilities (one per line)", key: "responsibilities" },
            { label: "Requirements (one per line)", key: "requirements" },
            { label: "Perks (one per line)", key: "perks" },
            { label: "Selection Process (one per line)", key: "process" },
          ].map(({ label, key }) => (
            <SurfaceCard key={key} className="p-4">
              <label className="space-y-1 text-sm">
                <span className="block text-xs font-semibold text-on-surface-variant">{label}</span>
                <textarea className="field-shell mt-2 min-h-24 w-full resize-none" disabled={isClosed} {...register(key)} />
              </label>
            </SurfaceCard>
          ))}
        </div>
      </form>

      {/* Status Controls */}
      <SurfaceCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-on-surface">Job Status</h3>
            <p className="text-xs text-on-surface-variant">Current: <strong>{job.status}</strong></p>
          </div>
          <div className="flex gap-2">
            {!isClosed ? (
              <Button variant="secondary" size="sm" disabled={isClosing} onClick={async () => {
                try { await closeJob(id); toast.success("Job closed."); }
                catch (err) { toast.error(err?.response?.data?.error || "Could not close job."); }
              }}>
                {isClosing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                Close Job
              </Button>
            ) : (
              <Button size="sm" disabled={isReopening} onClick={async () => {
                try { await reopenJob(id); toast.success("Job reopened."); }
                catch (err) { toast.error(err?.response?.data?.error || "Could not reopen job."); }
              }}>
                {isReopening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
                Reopen Job
              </Button>
            )}
          </div>
        </div>
      </SurfaceCard>

      {/* Danger Zone */}
      <SurfaceCard className="overflow-hidden border border-red-200">
        <button
          type="button"
          className="flex w-full items-center justify-between p-4 text-left"
          onClick={() => setShowDanger((v) => !v)}
        >
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <h3 className="font-semibold">Danger Zone</h3>
          </div>
          {showDanger ? <ChevronUp className="h-4 w-4 text-on-surface-variant" /> : <ChevronDown className="h-4 w-4 text-on-surface-variant" />}
        </button>

        {showDanger && (
          <div className="border-t border-red-100 p-4">
            <p className="text-sm text-on-surface-variant">
              Permanently deletes this job. Only allowed if <strong>no students have applied</strong>.
            </p>
            <p className="mt-3 text-sm font-semibold text-on-surface">
              Type the job title <code className="rounded bg-surface-container-low px-1.5 py-0.5 text-xs">{job.title}</code> to confirm:
            </p>
            <input
              className="field-shell mt-2 w-full max-w-md"
              placeholder="Type job title to confirm…"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                disabled={isDeleting || deleteConfirm !== job.title}
                onClick={async () => {
                  if (deleteConfirm !== job?.title) {
                    toast.error("Job title doesn't match.");
                    return;
                  }
                  try {
                    await deleteJob(id);
                    toast.success("Job deleted.");
                    navigate("/admin/jobs");
                  } catch (err) {
                    toast.error(err?.response?.data?.error || "Could not delete job.");
                  }
                }}
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete Job Permanently
              </Button>
            </div>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
