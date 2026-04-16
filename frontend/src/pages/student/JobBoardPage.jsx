import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import JobCard from "../../components/JobCard";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useJobs } from "../../hooks/useJobs";

const typeOptions = ["All", "Internship", "Full-time"];
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
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
  const { data: jobs = [], isLoading, isError, error } = useJobs({ ...filters, query: deferredQuery });
  const featuredJobs = useMemo(() => jobs.filter((job) => job.featured), [jobs]);

  if (isLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading job board…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Fetching eligible roles.</p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Job board unavailable</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "Could not load available jobs right now."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & filters */}
      <SurfaceCard className="p-3">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_0.9fr_auto]">
          <label className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2.5">
            <Search className="h-3.5 w-3.5 text-outline" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-outline"
              onChange={(e) => startTransition(() => setFilters((c) => ({ ...c, query: e.target.value })))}
              placeholder="Search roles, companies, or skills"
              value={filters.query}
            />
          </label>

          <input
            className="field-shell w-full"
            onChange={(e) => startTransition(() => setFilters((c) => ({ ...c, location: e.target.value })))}
            placeholder="Location or work mode"
            value={filters.location}
          />

          <select
            className="field-shell w-full"
            onChange={(e) =>
              startTransition(() =>
                setFilters((c) => ({
                  ...c,
                  type: e.target.value === "All" ? "" : e.target.value.toLowerCase(),
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
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              filters.eligibleOnly
                ? "bg-primary text-white"
                : "bg-surface-container-low text-on-surface-variant"
            }`}
            onClick={() => startTransition(() => setFilters((c) => ({ ...c, eligibleOnly: !c.eligibleOnly })))}
            type="button"
          >
            <Filter className="h-3.5 w-3.5" />
            Eligible only
          </button>
        </div>
      </SurfaceCard>

      {/* Featured */}
      {featuredJobs.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-3"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Featured</p>
            <h3 className="font-headline text-base font-bold">High-signal opportunities</h3>
          </div>
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 lg:grid-cols-2">
            {featuredJobs.map((job) => (
              <motion.div key={job.id} variants={fadeUp}>
                <JobCard className="border border-white/50" job={job} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* All roles */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: 0.05 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline text-base font-bold">All matching roles</h3>
            <p className="text-xs text-on-surface-variant">
              {jobs.length} role{jobs.length === 1 ? "" : "s"} with current filters
            </p>
          </div>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 lg:grid-cols-2">
          {jobs.map((job) => (
            <motion.div key={job.id} variants={fadeUp}>
              <JobCard job={job} />
            </motion.div>
          ))}
          {jobs.length === 0 && (
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <SurfaceCard className="p-6 text-center">
                <p className="font-headline text-base font-bold text-on-surface">No roles found</p>
                <p className="mt-1 text-sm text-on-surface-variant">
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
