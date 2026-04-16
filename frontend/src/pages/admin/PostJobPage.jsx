import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAdminJobs } from "../../hooks/useAdmin";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";

const schema = z.object({
  company: z.string().min(2, "Company name is required"),
  title: z.string().min(2, "Job title is required"),
  type: z.string().min(1),
  mode: z.string().min(1),
  location: z.string().min(2, "Location is required"),
  jobPackage: z.string().min(2, "Package info is required"),
  deadline: z.string().min(2, "Deadline is required"),
  minCgpa: z.coerce.number().min(0).max(10),
  maxActiveBacklogs: z.coerce.number().int().min(0).default(0),
  branches: z.string().min(2, "Provide eligible branches"),
  skills: z.string().min(2, "Provide skill tags"),
  description: z.string().min(20, "Use a richer description"),
  responsibilities: z.string().min(20, "Add a few responsibilities"),
});

export default function PostJobPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { createJob, isCreatingJob } = useAdminJobs();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createJob(values);
      toast.success(`"${values.title}" at ${values.company} published.`);
      navigate("/admin/jobs");
    } catch (error) {
      const details = error?.response?.data?.details;
      const message =
        error?.response?.data?.error ||
        (Array.isArray(details) ? details.join(", ") : null) ||
        "Job could not be published.";
      toast.error(message);
    }
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">New Opportunity</p>
          <h2 className="font-headline text-lg font-bold">Compose placement brief</h2>
        </div>
        <Button
          size="sm"
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={isSubmitting || isCreatingJob}
        >
          {isSubmitting || isCreatingJob ? "Publishing…" : "Publish Draft"}
        </Button>
      </div>

      <form ref={formRef} className="space-y-3" onSubmit={onSubmit}>
        {/* Core info */}
        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Core Posting Information</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {[
              ["company", "Company"],
              ["title", "Role Title"],
              ["location", "Location"],
              ["jobPackage", "Compensation"],
            ].map(([field, label]) => (
              <label key={field} className="space-y-1 text-sm">
                <span className="ml-1 block text-xs text-on-surface-variant">{label}</span>
                <input className="field-shell w-full" placeholder={`Enter ${label.toLowerCase()}`} {...register(field)} />
                {errors[field] && (
                  <p className="ml-1 text-xs font-medium text-error">{errors[field].message}</p>
                )}
              </label>
            ))}

            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Role Type</span>
              <select className="field-shell w-full" {...register("type")}>
                <option value="">Select type</option>
                <option>Internship</option>
                <option>Full-time</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Work Mode</span>
              <select className="field-shell w-full" {...register("mode")}>
                <option value="">Select mode</option>
                <option>Hybrid</option>
                <option>On-site</option>
                <option>Remote</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Application Deadline</span>
              <input className="field-shell w-full" placeholder="e.g. 30 Apr 2026" {...register("deadline")} />
            </label>

            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Minimum CGPA</span>
              <input className="field-shell w-full" step="0.01" type="number" placeholder="e.g. 7.5" {...register("minCgpa")} />
            </label>

            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Max Active Backlogs</span>
              <input className="field-shell w-full" type="number" min="0" placeholder="e.g. 0" {...register("maxActiveBacklogs")} />
            </label>
          </div>
        </SurfaceCard>

        {/* Eligibility */}
        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Eligibility & Skill Fit</h3>
          <div className="mt-3 grid gap-3">
            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Eligible Branches</span>
              <input className="field-shell w-full" placeholder="e.g. CSE, IT, ECE" {...register("branches")} />
              {errors.branches && (
                <p className="ml-1 text-xs font-medium text-error">{errors.branches.message}</p>
              )}
            </label>
            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Target Skills</span>
              <input className="field-shell w-full" placeholder="e.g. React, Node.js, DSA" {...register("skills")} />
              {errors.skills && (
                <p className="ml-1 text-xs font-medium text-error">{errors.skills.message}</p>
              )}
            </label>
          </div>
        </SurfaceCard>

        {/* Description */}
        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Editorial Description</h3>
          <div className="mt-3 grid gap-3">
            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Role Overview</span>
              <textarea
                className="field-shell min-h-24 w-full resize-none"
                placeholder="Describe the role, company culture, and what employees will work on…"
                {...register("description")}
              />
              {errors.description && (
                <p className="ml-1 text-xs font-medium text-error">{errors.description.message}</p>
              )}
            </label>
            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Responsibilities</span>
              <textarea
                className="field-shell min-h-24 w-full resize-none"
                placeholder="List key responsibilities, day-to-day expectations, and deliverables…"
                {...register("responsibilities")}
              />
              {errors.responsibilities && (
                <p className="ml-1 text-xs font-medium text-error">{errors.responsibilities.message}</p>
              )}
            </label>
          </div>
        </SurfaceCard>
      </form>
    </div>
  );
}
