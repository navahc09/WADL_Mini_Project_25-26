import { ArrowRight, BriefcaseBusiness, Clock3, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import SectionHeading from "../../components/ui/SectionHeading";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useAdminDashboard } from "../../hooks/useAdmin";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

const sectionFade = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Dashboard() {
  const { data, isLoading, isError, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading admin dashboard</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Pulling operational metrics, job inventory, and placement activity from the backend.
        </p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Dashboard unavailable</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load the admin workspace right now."}
        </p>
      </SurfaceCard>
    );
  }

  const overview = data?.overview || {};
  const jobs = data?.jobs || [];
  const placementFeed = data?.feed || [];
  const defaultJobId = jobs[0]?.id;

  const adminStats = [
    { label: "Total Students", value: overview.totalStudents ?? 0, note: "Campus population tracked" },
    { label: "Placed Students", value: overview.totalPlaced ?? 0, note: "Confirmed offer outcomes" },
    { label: "Placement Rate", value: `${overview.placementRate ?? 0}%`, note: "Current placement conversion" },
    { label: "Average Salary", value: `${overview.avgSalary ?? 0} LPA`, note: "Across current season" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="page-section grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {adminStats.map((item) => (
          <motion.div key={item.label} variants={fadeUp}>
            <SurfaceCard className="panel-hover p-6 h-full">
              <p className="text-sm text-on-surface-variant">{item.label}</p>
              <p className="mt-3 font-headline text-4xl font-extrabold">{item.value}</p>
              <p className="mt-4 text-sm font-semibold text-on-surface-variant">{item.note}</p>
            </SurfaceCard>
          </motion.div>
        ))}
      </motion.section>

      {/* Jobs + feed */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        animate="show"
        className="page-section grid gap-8 xl:grid-cols-[1.1fr_0.9fr]"
      >
        <div className="space-y-6">
          <SectionHeading
            label="Operational Pulse"
            title="Jobs that need placement-cell attention"
            description="Focus the team on roles with growing applicant volume, approaching deadlines, or recruiter follow-up needs."
            action={
              <Link to="/admin/jobs">
                <Button variant="secondary">
                  Manage inventory
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          />

          <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4">
            {jobs.map((job) => (
              <motion.div key={job.id} variants={fadeUp}>
                <SurfaceCard className="panel-hover p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-headline text-2xl font-bold">{job.title}</p>
                      <p className="mt-1 text-sm text-primary">{job.company}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.2rem] bg-surface-container-low px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-outline">Applicants</p>
                        <p className="mt-2 text-sm font-semibold text-on-surface">{job.applicants}</p>
                      </div>
                      <div className="rounded-[1.2rem] bg-surface-container-low px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-outline">Deadline</p>
                        <p className="mt-2 text-sm font-semibold text-on-surface">{job.deadline}</p>
                      </div>
                      <div className="rounded-[1.2rem] bg-surface-container-low px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-outline">Status</p>
                        <p className="mt-2 text-sm font-semibold text-on-surface">{job.status}</p>
                      </div>
                    </div>
                  </div>
                </SurfaceCard>
              </motion.div>
            ))}
            {jobs.length === 0 && (
              <SurfaceCard className="p-6 text-center">
                <p className="text-sm text-on-surface-variant">No active jobs yet. Post your first role.</p>
              </SurfaceCard>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <SurfaceCard className="panel-hover p-6">
            <span className="section-label">Today</span>
            <div className="mt-5 rounded-[1.4rem] bg-signature p-6 text-white">
              <p className="text-sm text-white/70">New applications today</p>
              <p className="mt-2 font-headline text-5xl font-extrabold">
                {overview.newApplicationsToday ?? 0}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Most inflow is currently concentrated in platform, UI engineering, and internship
                roles.
              </p>
            </div>
          </SurfaceCard>

          <SurfaceCard className="panel-hover p-6">
            <h3 className="font-headline text-2xl font-bold">Placement Feed</h3>
            <div className="mt-5 space-y-3">
              {placementFeed.map((item) => (
                <div key={item.id} className="rounded-[1.2rem] bg-surface-container-low p-4">
                  <p className="font-semibold text-on-surface">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">{item.detail}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                    {item.time}
                  </p>
                </div>
              ))}
              {placementFeed.length === 0 && (
                <p className="text-sm text-on-surface-variant">No recent placement activity.</p>
              )}
            </div>
          </SurfaceCard>
        </div>
      </motion.section>

      {/* Quick action cards */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="page-section grid gap-6 xl:grid-cols-3"
      >
        {[
          {
            icon: BriefcaseBusiness,
            title: "Live Opportunities",
            body: `${overview.activeJobs ?? 0} roles are active across internship and full-time tracks.`,
            action: null,
          },
          {
            icon: Clock3,
            title: "Pending Reviews",
            body: `${overview.pendingReviews ?? 0} applications are waiting for action or recruiter sync.`,
            action: null,
          },
          {
            icon: FileSpreadsheet,
            title: "Export Ready",
            body: "Candidate snapshots for active hiring cycles are available for recruiter export.",
            action: defaultJobId
              ? { label: "Open review board", to: `/admin/jobs/${defaultJobId}/applicants` }
              : null,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} variants={fadeUp}>
              <SurfaceCard className="panel-hover p-6 h-full">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-primary-fixed p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-headline text-2xl font-bold">{card.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-on-surface-variant">{card.body}</p>
                    {card.action && (
                      <Link className="mt-4 inline-flex" to={card.action.to}>
                        <Button variant="secondary">{card.action.label}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SurfaceCard>
            </motion.div>
          );
        })}
      </motion.section>
    </div>
  );
}
