import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import JobCard from "../../components/JobCard";
import SectionHeading from "../../components/ui/SectionHeading";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useJobs } from "../../hooks/useJobs";

const typeOptions = ["All", "Internship", "Full-time"];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function JobBoardPage() {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    query: searchParams.get("q") || "",
    location: "",
    type: "",
    eligibleOnly: false,
  });

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setFilters((prev) => ({ ...prev, query: q }));
  }, [searchParams]);

  const deferredQuery = useDeferredValue(filters.query);

  const { data: jobs = [], isLoading, isError, error } = useJobs({
    ...filters,
    query: deferredQuery,
  });

  const featuredJobs = useMemo(() => jobs.filter((job) => job.featured), [jobs]);

  if (isLoading) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading job board</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Fetching eligible roles and recruiter filters from the backend.
        </p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Job board unavailable</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load available jobs right now."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        label="Curated Careers"
        title="Browse roles with eligibility context built in"
        description="Search by company, location, and role type, then focus only on positions that already fit your current academic profile."
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <SurfaceCard className="p-6">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_0.9fr_auto]">
            <label className="flex items-center gap-3 rounded-[1.2rem] bg-surface-container-low px-4 py-3.5">
              <Search className="h-4 w-4 text-outline" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-outline"
                onChange={(event) =>
                  startTransition(() =>
                    setFilters((current) => ({ ...current, query: event.target.value })),
                  )
                }
                placeholder="Search roles, companies, or skill clusters"
                value={filters.query}
              />
            </label>

            <input
              className="field-shell w-full"
              onChange={(event) =>
                startTransition(() =>
                  setFilters((current) => ({ ...current, location: event.target.value })),
                )
              }
              placeholder="Location or work mode"
              value={filters.location}
            />

            <select
              className="field-shell w-full"
              onChange={(event) =>
                startTransition(() =>
                  setFilters((current) => ({
                    ...current,
                    type: event.target.value === "All" ? "" : event.target.value.toLowerCase(),
                  }))
                )
              }
              value={filters.type ? filters.type[0].toUpperCase() + filters.type.slice(1) : "All"}
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <button
              className={`inline-flex items-center justify-center gap-2 rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition-colors ${
                filters.eligibleOnly
                  ? "bg-primary text-white"
                  : "bg-surface-container-low text-on-surface-variant"
              }`}
              onClick={() =>
                startTransition(() =>
                  setFilters((current) => ({ ...current, eligibleOnly: !current.eligibleOnly })),
                )
              }
              type="button"
            >
              <Filter className="h-4 w-4" />
              Eligible only
            </button>
          </div>
        </SurfaceCard>
      </motion.div>

      {featuredJobs.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="space-y-5"
        >
          <SectionHeading
            label="Featured"
            title="High-signal opportunities"
            description="A highlighted shortlist of roles with premium compensation and strong alignment to your profile."
          />
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-6 lg:grid-cols-2">
            {featuredJobs.map((job) => (
              <motion.div key={job.id} variants={fadeUp}>
                <JobCard className="border border-white/50" job={job} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        className="space-y-5"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-headline text-3xl font-bold">All matching roles</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {jobs.length} role{jobs.length === 1 ? "" : "s"} visible with current filters.
            </p>
          </div>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-6 lg:grid-cols-2">
          {jobs.map((job) => (
            <motion.div key={job.id} variants={fadeUp}>
              <JobCard job={job} />
            </motion.div>
          ))}
          {jobs.length === 0 && (
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <SurfaceCard className="p-10 text-center">
                <p className="font-headline text-xl font-bold text-on-surface">No roles found</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Try adjusting your search or filter settings.
                </p>
              </SurfaceCard>
            </motion.div>
          )}
        </motion.div>
      </motion.section>
    </div>
  );
}
