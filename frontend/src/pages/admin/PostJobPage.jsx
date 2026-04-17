import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminJobs, useValidateJD } from "../../hooks/useAdmin";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { checkJDClient } from "../../lib/jdChecker";

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

const SEVERITY_STYLES = {
  error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: AlertCircle, iconColor: "text-red-500" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: AlertTriangle, iconColor: "text-amber-500" },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Info, iconColor: "text-blue-400" },
};

function QualityGauge({ score }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  const label = score >= 80 ? "Good" : score >= 50 ? "Needs Work" : "Incomplete";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-on-surface-variant">JD Quality</span>
        <span className={`text-xs font-bold ${score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600"}`}>
          {score}/100 — {label}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-container-low overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}

export default function PostJobPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { createJob, isCreatingJob } = useAdminJobs();
  const [jdReport, setJdReport] = useState(null);
  const [showQuality, setShowQuality] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  function runQualityCheck() {
    const values = getValues();
    const result = checkJDClient(values);
    setJdReport(result);
    setShowQuality(true);
  }

  const onSubmit = handleSubmit(async (values) => {
    // Auto-check quality before submitting
    const check = checkJDClient(values);
    if (!check.canPublish) {
      setJdReport(check);
      setShowQuality(true);
      toast.error(`Fix ${check.warnings.filter((w) => w.severity === "error").length} error(s) before publishing.`);
      return;
    }

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
        <div className="flex gap-2">
          <Button size="sm" type="button" variant="secondary" onClick={runQualityCheck}>
            <ShieldCheck className="h-3.5 w-3.5" /> Check Quality
          </Button>
          <Button
            size="sm" type="button"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={isSubmitting || isCreatingJob}
          >
            {isSubmitting || isCreatingJob ? "Publishing…" : "Publish Draft"}
          </Button>
        </div>
      </div>

      {/* JD Quality Panel */}
      <AnimatePresence>
        {showQuality && jdReport && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <SurfaceCard className="p-4 space-y-3">
              <QualityGauge score={jdReport.qualityScore} />
              {jdReport.warnings.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-700">JD looks complete and publish-ready.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {jdReport.warnings.map((w, i) => {
                    const s = SEVERITY_STYLES[w.severity] || SEVERITY_STYLES.info;
                    const Icon = s.icon;
                    return (
                      <div key={i} className={`flex items-start gap-2 rounded-xl border ${s.bg} ${s.border} px-3 py-2.5`}>
                        <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${s.iconColor}`} />
                        <p className={`text-xs leading-5 ${s.text}`}>{w.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </SurfaceCard>
          </motion.div>
        )}
      </AnimatePresence>

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
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Hard filters (branch, CGPA, backlogs) determine eligibility. Skills determine fit score among eligible candidates.
          </p>
          <div className="mt-3 grid gap-3">
            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Eligible Branches (hard filter)</span>
              <input className="field-shell w-full" placeholder="e.g. CSE, IT, ECE" {...register("branches")} />
              {errors.branches && (
                <p className="ml-1 text-xs font-medium text-error">{errors.branches.message}</p>
              )}
            </label>
            <label className="space-y-1 text-sm">
              <span className="ml-1 block text-xs text-on-surface-variant">Target Skills (fit score)</span>
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
