import {
  ArrowRight,
  CalendarClock,
  FolderOpen,
  Send,
  Sparkles,
  Trophy,
  UserCheck2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import JobCard from "../../components/JobCard";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useStudentDashboard } from "../../hooks/useStudent";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Dashboard() {
  const { data, isLoading, isError, error } = useStudentDashboard();

  if (isLoading) {
    return (
      <SurfaceCard className="p-6">
        <h2 className="font-headline text-2xl font-bold">Loading dashboard…</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Fetching your profile and placement data.</p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-6">
        <h2 className="font-headline text-2xl font-bold">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "Could not load dashboard right now."}
        </p>
      </SurfaceCard>
    );
  }

  const profile = data?.profile;
  const stats = data?.stats || {};
  const featuredJobs = data?.featuredJobs || [];
  const applications = data?.applications || [];
  const documents = data?.documents || [];
  const primaryResume = documents.find((d) => d.primary);

  const statCards = [
    { label: "Applications", value: stats.applicationsSent ?? 0, note: "Sent this season", icon: Send, tone: "text-primary" },
    { label: "Interviews", value: stats.activeInterviews ?? 0, note: "Active rounds", icon: CalendarClock, tone: "text-tertiary" },
    { label: "Offers", value: stats.offersReceived ?? 0, note: "Received", icon: Trophy, tone: "text-emerald-600" },
    { label: "Profile", value: `${stats.profileCompleteness ?? 0}%`, note: "Complete", icon: UserCheck2, tone: "text-primary" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Stat row ── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.label} variants={fadeUp}>
              <SurfaceCard className="panel-hover flex items-center gap-4 p-4">
                <div className={`rounded-2xl bg-surface-container-low p-2.5 ${item.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-on-surface-variant">{item.label}</p>
                  <p className="mt-0.5 font-headline text-2xl font-extrabold text-on-surface">{item.value}</p>
                  <p className="text-xs text-on-surface-variant">{item.note}</p>
                </div>
              </SurfaceCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Hero + side ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
        className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"
      >
        {/* Hero banner */}
        <SurfaceCard className="overflow-hidden p-0">
          <div className="grid h-full lg:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-signature px-6 py-5 text-white">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                Student Readiness
              </span>
              <h2 className="mt-3 font-headline text-2xl font-extrabold leading-[1.1]">
                {profile?.firstName || "Student"}, your placement momentum is strong.
              </h2>
              <p className="mt-2 text-xs leading-6 text-white/75">
                Your profile, applications, and documents are synced with the latest backend data.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/student/jobs">
                  <Button className="bg-white text-primary hover:text-primary" size="sm">
                    Explore jobs <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link to="/student/profile">
                  <Button className="border border-white/15 bg-white/10 text-white" size="sm">
                    Refine profile
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 bg-surface-container-low px-5 py-5">
              <div>
                <p className="text-xs font-semibold text-on-surface">Profile completeness</p>
                <p className="mt-1 font-headline text-3xl font-extrabold text-primary">
                  {stats.profileCompleteness ?? 0}%
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-surface-container-high">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.profileCompleteness ?? 0}%` }}
                    transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {(profile?.preferences?.locations || []).slice(0, 2).map((loc) => (
                  <div key={loc} className="rounded-xl bg-surface-container-lowest px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-outline">Location</p>
                    <p className="mt-0.5 text-sm font-semibold text-on-surface">{loc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* Side cards */}
        <div className="grid gap-4">
          <SurfaceCard className="panel-hover p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-tertiary-fixed p-2.5 text-tertiary">
                <FolderOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-on-surface">Document health</p>
                <h3 className="mt-1 font-headline text-base font-bold">
                  {primaryResume ? "Primary resume synced" : "Resume upload pending"}
                </h3>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                  {primaryResume
                    ? `${primaryResume.name} is marked primary.`
                    : "Upload a resume to power your applications."}
                </p>
                <Link className="mt-2 inline-flex" to="/student/documents">
                  <Button variant="secondary" size="sm">Open vault</Button>
                </Link>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="panel-hover p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary-fixed p-2.5 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-on-surface">Upcoming moments</p>
                <div className="mt-2 space-y-2">
                  {(profile?.upcomingEvents || []).slice(0, 2).map((event) => (
                    <div key={event.id} className="rounded-xl bg-surface-container-low px-3 py-2">
                      <p className="text-xs font-semibold text-on-surface">{event.title}</p>
                      <p className="mt-0.5 text-xs text-on-surface-variant">{event.schedule}</p>
                    </div>
                  ))}
                  {(profile?.upcomingEvents || []).length === 0 && (
                    <p className="text-xs text-on-surface-variant">No upcoming events.</p>
                  )}
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </motion.div>

      {/* ── Featured Jobs + Applications ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
        className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]"
      >
        {/* Featured jobs */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Featured Matches</p>
              <h3 className="font-headline text-lg font-bold">High-signal roles</h3>
            </div>
            <Link to="/student/jobs">
              <Button variant="secondary" size="sm">All jobs <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 lg:grid-cols-2">
            {featuredJobs.slice(0, 2).map((job) => (
              <motion.div key={job.id} variants={fadeUp}>
                <JobCard job={job} />
              </motion.div>
            ))}
            {featuredJobs.length === 0 && (
              <SurfaceCard className="p-5 text-center lg:col-span-2">
                <p className="text-sm text-on-surface-variant">No featured roles right now.</p>
              </SurfaceCard>
            )}
          </motion.div>
        </div>

        {/* Application movement */}
        <SurfaceCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-headline text-base font-bold">Applications</h3>
            <Link to="/student/applications">
              <Button variant="secondary" size="sm">View all</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {applications.slice(0, 4).map((application) => (
              <div key={application.id} className="rounded-xl bg-surface-container-low px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-on-surface">{application.role}</p>
                    <p className="truncate text-xs text-primary">{application.company}</p>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </div>
              </div>
            ))}
            {applications.length === 0 && (
              <p className="text-xs text-on-surface-variant">No applications yet.</p>
            )}
          </div>
        </SurfaceCard>
      </motion.div>
    </div>
  );
}
