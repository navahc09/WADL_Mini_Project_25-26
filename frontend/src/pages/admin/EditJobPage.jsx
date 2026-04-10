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
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import SectionHeading from "../../components/ui/SectionHeading";
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

  // Ensure jobs are loaded so useAdminJob can find it
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
      company: "",
      title: "",
      type: "",
      mode: "",
      location: "",
      salaryLabel: "",
      minCgpa: "",
      maxActiveBacklogs: "",
      branches: "",
      skills: "",
      deadline: "",
      description: "",
      aboutCompany: "",
      responsibilities: "",
      requirements: "",
      perks: "",
      process: "",
    },
  });

  useEffect(() => {
    if (!job) return;
    const deadlineRaw = job.deadlineRaw || "";
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
      deadline: deadlineRaw,
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
        company: values.company,
        title: values.title,
        type: values.type,
        mode: values.mode,
        location: values.location,
        salaryLabel: values.salaryLabel,
        minCgpa: Number(values.minCgpa),
        maxActiveBacklogs: Number(values.maxActiveBacklogs ?? 0),
        branches: values.branches,
        skills: values.skills,
        deadline: values.deadline,
        description: values.description,
        aboutCompany: values.aboutCompany,
        responsibilities: values.responsibilities,
        requirements: values.requirements,
        perks: values.perks,
        process: values.process,
      });
      toast.success("Job updated successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Update failed.");
    }
  });

  const handleClose = async () => {
    try {
      await closeJob(id);
      toast.success("Job closed.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not close job.");
    }
  };

  const handleReopen = async () => {
    try {
      await reopenJob(id);
      toast.success("Job reopened.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not reopen job.");
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== job?.title) {
      toast.error("Job title doesn't match. Type exactly to confirm deletion.");
      return;
    }
    try {
      await deleteJob(id);
      toast.success("Job deleted.");
      navigate("/admin/jobs");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not delete job.");
    }
  };

  if (jobsLoading) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading job data</h2>
        <p className="mt-3 text-sm text-on-surface-variant">Fetching current job details...</p>
      </SurfaceCard>
    );
  }

  if (!job) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Job not found</h2>
        <Link to="/admin/jobs">
          <Button variant="secondary" className="mt-6">
            <ArrowLeft className="h-4 w-4" /> Back to Jobs
          </Button>
        </Link>
      </SurfaceCard>
    );
  }

  const isClosed = job.status === "Closed";

  return (
    <div className="space-y-6">
      <Link to="/admin/jobs" className="inline-flex">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4" />
          Back to Job Board
        </Button>
      </Link>

      <SectionHeading
        label="Edit Job"
        title={`${job.company} — ${job.title}`}
        description="Update role details, eligibility criteria, or deadline. Changes take effect immediately for students viewing the board."
        action={
          <Button
            size="lg"
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={isUpdating || isClosed}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        }
      />

      {isClosed && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Lock className="h-5 w-5 shrink-0 text-amber-500" />
          This job is <strong>closed</strong>. Reopen it to allow edits.
        </div>
      )}

      <form ref={formRef} onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-2">
        {/* Company & Role */}
        <SurfaceCard className="p-6 xl:col-span-2">
          <h3 className="font-headline text-xl font-bold">Role Identity</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { label: "Company", key: "company" },
              { label: "Job Title", key: "title" },
              { label: "Location", key: "location" },
            ].map(({ label, key }) => (
              <label key={key} className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">{label}</span>
                <input className="field-shell w-full" disabled={isClosed} {...register(key)} />
              </label>
            ))}
            <label className="space-y-2 text-sm">
              <span className="ml-1 block text-on-surface-variant">Job Type</span>
              <select className="field-shell w-full" disabled={isClosed} {...register("type")}>
                <option value="">Select type</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="ml-1 block text-on-surface-variant">Work Mode</span>
              <select className="field-shell w-full" disabled={isClosed} {...register("mode")}>
                <option value="">Select mode</option>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="ml-1 block text-on-surface-variant">Salary Label</span>
              <input className="field-shell w-full" disabled={isClosed} {...register("salaryLabel")} />
            </label>
          </div>
        </SurfaceCard>

        {/* Eligibility */}
        <SurfaceCard className="p-6">
          <h3 className="font-headline text-xl font-bold">Eligibility</h3>
          <div className="mt-5 space-y-4">
            <label className="space-y-2 text-sm">
              <span className="ml-1 block text-on-surface-variant">Min CGPA</span>
              <input
                className="field-shell w-full"
                type="number"
                step="0.01"
                disabled={isClosed}
                {...register("minCgpa")}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="ml-1 block text-on-surface-variant">Max Active Backlogs</span>
              <input
                className="field-shell w-full"
                type="number"
                min="0"
                disabled={isClosed}
                {...register("maxActiveBacklogs")}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="ml-1 block text-on-surface-variant">
                Eligible Branches (comma-separated)
              </span>
              <input className="field-shell w-full" disabled={isClosed} {...register("branches")} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="ml-1 block text-on-surface-variant">
                Required Skills (comma-separated)
              </span>
              <input className="field-shell w-full" disabled={isClosed} {...register("skills")} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="ml-1 block text-on-surface-variant">Application Deadline</span>
              <input
                className="field-shell w-full"
                type="date"
                disabled={isClosed}
                {...register("deadline")}
              />
            </label>
          </div>
        </SurfaceCard>

        {/* Description */}
        <SurfaceCard className="p-6">
          <h3 className="font-headline text-xl font-bold">Description</h3>
          <div className="mt-5 space-y-4">
            <label className="space-y-2 text-sm">
              <span className="ml-1 block text-on-surface-variant">Job Description</span>
              <textarea
                className="field-shell min-h-28 w-full resize-none"
                disabled={isClosed}
                {...register("description")}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="ml-1 block text-on-surface-variant">About Company</span>
              <textarea
                className="field-shell min-h-24 w-full resize-none"
                disabled={isClosed}
                {...register("aboutCompany")}
              />
            </label>
          </div>
        </SurfaceCard>

        {/* Lists (one per line) */}
        {[
          { label: "Responsibilities (one per line)", key: "responsibilities" },
          { label: "Requirements (one per line)", key: "requirements" },
          { label: "Perks (one per line)", key: "perks" },
          { label: "Selection Process (one per line)", key: "process" },
        ].map(({ label, key }) => (
          <SurfaceCard key={key} className="p-6">
            <label className="space-y-2 text-sm">
              <span className="font-headline text-xl font-bold block mb-4">{label}</span>
              <textarea
                className="field-shell min-h-32 w-full resize-none"
                disabled={isClosed}
                {...register(key)}
              />
            </label>
          </SurfaceCard>
        ))}
      </form>

      {/* Status Controls */}
      <SurfaceCard className="p-6">
        <h3 className="font-headline text-xl font-bold">Job Status</h3>
        <p className="mt-2 text-sm text-on-surface-variant">
          Current status: <strong>{job.status}</strong>
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {!isClosed ? (
            <Button
              variant="secondary"
              disabled={isClosing}
              onClick={handleClose}
            >
              {isClosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Close Job
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={isReopening}
              onClick={handleReopen}
            >
              {isReopening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              Reopen Job
            </Button>
          )}
        </div>
      </SurfaceCard>

      {/* Danger Zone */}
      <SurfaceCard className="overflow-hidden border border-red-200">
        <button
          type="button"
          className="flex w-full items-center justify-between p-6 text-left"
          onClick={() => setShowDanger((v) => !v)}
        >
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-headline text-xl font-bold">Danger Zone</h3>
          </div>
          {showDanger ? (
            <ChevronUp className="h-5 w-5 text-on-surface-variant" />
          ) : (
            <ChevronDown className="h-5 w-5 text-on-surface-variant" />
          )}
        </button>

        {showDanger && (
          <div className="border-t border-red-100 p-6">
            <p className="text-sm text-on-surface-variant">
              Permanently deletes this job. This is only allowed if <strong>no students have applied</strong>.
              If applicants exist, close the job instead.
            </p>
            <p className="mt-4 text-sm font-semibold text-on-surface">
              Type the job title <code className="rounded bg-surface-container-low px-2 py-0.5">{job.title}</code> to confirm:
            </p>
            <input
              className="field-shell mt-3 w-full max-w-md"
              placeholder="Type job title to confirm..."
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            <div className="mt-4">
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                disabled={isDeleting || deleteConfirm !== job.title}
                onClick={handleDelete}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Job Permanently
              </Button>
            </div>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
