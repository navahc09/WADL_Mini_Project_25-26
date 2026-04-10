import { ArrowRight, Building2, Clock3, MapPin, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SurfaceCard from "./ui/SurfaceCard";
import { cn } from "../lib/utils";

export default function JobCard({ job, className }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-full"
    >
      <SurfaceCard
        className={cn(
          "group flex h-full flex-col gap-6 overflow-hidden p-6",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low font-headline text-lg font-extrabold text-primary">
              {job.companyInitials}
            </div>
            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface">{job.title}</h3>
              <p className="text-sm font-medium text-primary">{job.company}</p>
            </div>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]",
              job.eligible
                ? "bg-emerald-100 text-emerald-700"
                : "bg-error-container text-on-error-container",
            )}
          >
            {job.eligible ? "Eligible" : "Not Eligible"}
          </span>
        </div>

        <p className="min-h-[72px] text-sm leading-6 text-on-surface-variant">{job.description}</p>

        <div className="flex flex-wrap gap-2">
          {[`${job.type}`, `${job.mode}`, ...(job.tags?.slice(0, 1) || [])].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span>{job.salaryLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Min CGPA {job.minCgpa}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <span>Deadline {job.deadline}</span>
          </div>
        </div>

        <Link
          className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-primary transition-transform group-hover:translate-x-1"
          to={`/student/jobs/${job.id}`}
        >
          View details
          <ArrowRight className="h-4 w-4" />
        </Link>
      </SurfaceCard>
    </motion.div>
  );
}
