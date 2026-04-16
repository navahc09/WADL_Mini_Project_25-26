import { ArrowRight, BriefcaseBusiness, Clock3, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useAdminDashboard } from "../../hooks/useAdmin";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Dashboard() {
  const { data, isLoading, isError, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <SurfaceCard className="p-6">
        <h2 className="font-headline text-2xl font-bold">Loading dashboard…</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Fetching placement metrics.</p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-6">
        <h2 className="font-headline text-2xl font-bold">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "Could not load dashboard."}
        </p>
      </SurfaceCard>
    );
  }

  const overview = data?.overview || {};
  const jobs = data?.jobs || [];
  const placementFeed = data?.feed || [];
  const defaultJobId = jobs[0]?.id;

  const adminStats = [
    { label: "Total Students", value: overview.totalStudents ?? 0, note: "Campus population" },
    { label: "Placed", value: overview.totalPlaced ?? 0, note: "Confirmed offers" },
    { label: "Placement Rate", value: `${overview.placementRate ?? 0}%`, note: "Current conversion" },
    { label: "Avg. Package", value: `${overview.avgSalary ?? 0} LPA`, note: "This season" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Stat row ── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {adminStats.map((item) => (
          <motion.div key={item.label} variants={fadeUp}>
            <SurfaceCard className="panel-hover p-4">
              <p className="text-xs text-on-surface-variant">{item.label}</p>
              <p className="mt-1 font-headline text-3xl font-extrabold">{item.value}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{item.note}</p>
            </SurfaceCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Jobs + Feed ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
        className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"
      >
        {/* Jobs needing attention */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Operational Pulse</p>
              <h3 className="font-headline text-lg font-bold">Jobs needing attention</h3>
            </div>
            <Link to="/admin/jobs">
              <Button variant="secondary" size="sm">
                All jobs <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {jobs.slice(0, 4).map((job) => (
              <motion.div key={job.id} variants={fadeUp}>
                <SurfaceCard className="panel-hover p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-on-surface">{job.title}</p>
                      <p className="truncate text-xs text-primary">{job.company}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {[
                        { label: "Applicants", value: job.applicants },
                        { label: "Deadline", value: job.deadline },
                        { label: "Status", value: job.status },
                      ].map((cell) => (
                        <div key={cell.label} className="rounded-xl bg-surface-container-low px-3 py-2 text-center min-w-[72px]">
                          <p className="text-[10px] uppercase tracking-wide text-outline">{cell.label}</p>
                          <p className="mt-0.5 text-xs font-semibold text-on-surface">{cell.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </SurfaceCard>
              </motion.div>
            ))}
            {jobs.length === 0 && (
              <SurfaceCard className="p-5 text-center">
                <p className="text-sm text-on-surface-variant">No active jobs. Post your first role.</p>
                <Link to="/admin/jobs/new" className="mt-2 inline-flex">
                  <Button size="sm">Post Job</Button>
                </Link>
              </SurfaceCard>
            )}
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Today counter */}
          <SurfaceCard className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Today</p>
            <div className="mt-2 rounded-2xl bg-signature p-4 text-white">
              <p className="text-xs text-white/70">New applications</p>
              <p className="mt-1 font-headline text-4xl font-extrabold">{overview.newApplicationsToday ?? 0}</p>
              <p className="mt-2 text-xs leading-5 text-white/75">
                Inflow concentrated in platform, UI, and internship roles.
              </p>
            </div>
          </SurfaceCard>

          {/* Placement feed */}
          <SurfaceCard className="p-4">
            <h3 className="font-headline text-base font-bold">Placement Feed</h3>
            <div className="mt-3 space-y-2">
              {placementFeed.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-xl bg-surface-container-low p-3">
                  <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-on-surface-variant">{item.detail}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-outline">{item.time}</p>
                </div>
              ))}
              {placementFeed.length === 0 && (
                <p className="text-xs text-on-surface-variant">No recent activity.</p>
              )}
            </div>
          </SurfaceCard>
        </div>
      </motion.div>

      {/* ── Quick actions ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid gap-3 xl:grid-cols-3"
      >
        {[
          {
            icon: BriefcaseBusiness,
            title: "Live Opportunities",
            body: `${overview.activeJobs ?? 0} active roles across internship and full-time tracks.`,
            action: null,
          },
          {
            icon: Clock3,
            title: "Pending Reviews",
            body: `${overview.pendingReviews ?? 0} applications waiting for action or recruiter sync.`,
            action: null,
          },
          {
            icon: FileSpreadsheet,
            title: "Export Ready",
            body: "Candidate snapshots available for recruiter export.",
            action: defaultJobId
              ? { label: "Open review board", to: `/admin/jobs/${defaultJobId}/applicants` }
              : null,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} variants={fadeUp}>
              <SurfaceCard className="panel-hover p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary-fixed p-2.5 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">{card.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-on-surface-variant">{card.body}</p>
                    {card.action && (
                      <Link className="mt-2 inline-flex" to={card.action.to}>
                        <Button variant="secondary" size="sm">{card.action.label}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SurfaceCard>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
