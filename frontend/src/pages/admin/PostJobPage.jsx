import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAdminJobs } from "../../hooks/useAdmin";
import Button from "../../components/ui/Button";
import SectionHeading from "../../components/ui/SectionHeading";
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
  branches: z.string().min(2, "Provide eligible branches"),
  skills: z.string().min(2, "Provide skill tags"),
  description: z.string().min(20, "Use a richer description"),
  responsibilities: z.string().min(20, "Add a few responsibilities"),
});

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.08 },
  }),
};

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
      toast.success(`"${values.title}" at ${values.company} published to job board.`);
      navigate("/admin/jobs");
    } catch (error) {
      const details = error?.response?.data?.details;
      const message =
        error?.response?.data?.error ||
        (Array.isArray(details) ? details.join(", ") : null) ||
        "Job could not be published right now.";
      toast.error(message);
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        label="New Opportunity"
        title="Compose the next placement brief"
        description="Capture eligibility logic, compensation, and recruiter expectations in one polished publishing flow."
        action={
          <Button
            size="lg"
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={isSubmitting || isCreatingJob}
          >
            {isSubmitting || isCreatingJob ? "Publishing..." : "Publish Draft"}
          </Button>
        }
      />

      <form ref={formRef} className="space-y-6" onSubmit={onSubmit}>
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <SurfaceCard className="page-section p-6">
            <h3 className="font-headline text-2xl font-bold">Core Posting Information</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["company", "Company"],
                ["title", "Role Title"],
                ["location", "Location"],
                ["jobPackage", "Compensation"],
              ].map(([field, label]) => (
                <label key={field} className="space-y-2 text-sm">
                  <span className="ml-1 block text-on-surface-variant">{label}</span>
                  <input className="field-shell w-full" placeholder={`Enter ${label.toLowerCase()}`} {...register(field)} />
                  {errors[field] ? (
                    <p className="ml-1 text-xs font-medium text-error">{errors[field].message}</p>
                  ) : null}
                </label>
              ))}

              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Role Type</span>
                <select className="field-shell w-full" {...register("type")}>
                  <option value="">Select type</option>
                  <option>Internship</option>
                  <option>Full-time</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Work Mode</span>
                <select className="field-shell w-full" {...register("mode")}>
                  <option value="">Select mode</option>
                  <option>Hybrid</option>
                  <option>On-site</option>
                  <option>Remote</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Application Deadline</span>
                <input className="field-shell w-full" placeholder="e.g. 30 Apr 2026" {...register("deadline")} />
              </label>

              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Minimum CGPA</span>
                <input className="field-shell w-full" step="0.01" type="number" placeholder="e.g. 7.5" {...register("minCgpa")} />
              </label>
            </div>
          </SurfaceCard>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
          <SurfaceCard className="page-section p-6">
            <h3 className="font-headline text-2xl font-bold">Eligibility and Skill Fit</h3>
            <div className="mt-5 grid gap-4">
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Eligible Branches</span>
                <input className="field-shell w-full" placeholder="e.g. CSE, IT, ECE" {...register("branches")} />
                {errors.branches ? (
                  <p className="ml-1 text-xs font-medium text-error">{errors.branches.message}</p>
                ) : null}
              </label>
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Target Skills</span>
                <input className="field-shell w-full" placeholder="e.g. React, Node.js, DSA" {...register("skills")} />
                {errors.skills ? (
                  <p className="ml-1 text-xs font-medium text-error">{errors.skills.message}</p>
                ) : null}
              </label>
            </div>
          </SurfaceCard>
        </motion.div>

        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
          <SurfaceCard className="page-section p-6">
            <h3 className="font-headline text-2xl font-bold">Editorial Description</h3>
            <div className="mt-5 grid gap-4">
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Role Overview</span>
                <textarea
                  className="field-shell min-h-32 w-full resize-none"
                  placeholder="Describe the role, company culture, and what interns or employees will work on…"
                  {...register("description")}
                />
                {errors.description ? (
                  <p className="ml-1 text-xs font-medium text-error">{errors.description.message}</p>
                ) : null}
              </label>
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Responsibilities</span>
                <textarea
                  className="field-shell min-h-32 w-full resize-none"
                  placeholder="List key responsibilities, day-to-day expectations, and deliverables…"
                  {...register("responsibilities")}
                />
                {errors.responsibilities ? (
                  <p className="ml-1 text-xs font-medium text-error">{errors.responsibilities.message}</p>
                ) : null}
              </label>
            </div>
          </SurfaceCard>
        </motion.div>
      </form>
    </div>
  );
}
