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
import SectionHeading from "../../components/ui/SectionHeading";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useStudentDashboard } from "../../hooks/useStudent";

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
  const { data, isLoading, isError, error } = useStudentDashboard();

  if (isLoading) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading your dashboard</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Pulling profile, job, and application signals from the backend.
        </p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Dashboard unavailable</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load the student dashboard right now."}
        </p>
      </SurfaceCard>
    );
  }

  const profile = data?.profile;
  const stats = data?.stats || {};
  const featuredJobs = data?.featuredJobs || [];
  const applications = data?.applications || [];
  const documents = data?.documents || [];
  const primaryResume = documents.find((document) => document.primary);

  const statCards = [
    {
      label: "Applications Sent",
      value: stats.applicationsSent ?? 0,
      note: `${applications.length} active snapshot${applications.length === 1 ? "" : "s"}`,
      icon: Send,
      tone: "text-primary",
    },
    {
      label: "Active Interviews",
      value: stats.activeInterviews ?? 0,
      note: "Interview-stage opportunities in motion",
      icon: CalendarClock,
      tone: "text-tertiary",
    },
    {
      label: "Offers Received",
      value: stats.offersReceived ?? 0,
      note: "Offer progress from current cycle",
      icon: Trophy,
      tone: "text-emerald-600",
    },
    {
      label: "Profile Completeness",
      value: `${stats.profileCompleteness ?? 0}%`,
      note: "Recruiter-ready academic profile",
      icon: UserCheck2,
      tone: "text-primary",
    },
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
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.label} variants={fadeUp}>
              <SurfaceCard className="panel-hover p-6 h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-on-surface-variant">{item.label}</p>
                    <p className="mt-3 font-headline text-4xl font-extrabold text-on-surface">
                      {item.value}
                    </p>
                  </div>
                  <div className={`rounded-2xl bg-surface-container-low p-3 ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold text-on-surface-variant">{item.note}</p>
              </SurfaceCard>
            </motion.div>
          );
        })}
      </motion.section>

      {/* Hero banner + side cards */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        animate="show"
        className="page-section grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
      >
        <SurfaceCard className="overflow-hidden p-0">
          <div className="grid h-full gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-signature px-7 py-7 text-white md:px-8">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                Student Readiness
              </span>
              <h2 className="mt-5 font-headline text-4xl font-extrabold leading-[1.05]">
                {profile?.firstName || "Student"}, your placement momentum is strong.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
                Your profile, applications, and documents are now flowing from the live backend so
                recruiter-facing signals stay in sync.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/student/jobs">
                  <Button className="bg-white text-primary hover:text-primary" size="lg">
                    Explore jobs
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/student/profile">
                  <Button className="border border-white/15 bg-white/10 text-white" size="lg">
                    Refine profile
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-5 bg-surface-container-low p-7 md:p-8">
              <div>
                <p className="text-sm font-semibold text-on-surface">Profile completeness</p>
                <p className="mt-2 font-headline text-5xl font-extrabold text-primary">
                  {stats.profileCompleteness ?? 0}%
                </p>
                <div className="mt-4 h-2 rounded-full bg-surface-container-high">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.profileCompleteness ?? 0}%` }}
                    transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {(profile?.preferences?.locations || []).map((location) => (
                  <div
                    key={location}
                    className="rounded-[1.2rem] bg-surface-container-lowest px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-outline">
                      Preferred location
                    </p>
                    <p className="mt-1 font-semibold text-on-surface">{location}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-6">
          <SurfaceCard className="panel-hover p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-tertiary-fixed p-3 text-tertiary">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Document health</p>
                <h3 className="mt-2 font-headline text-2xl font-bold">
                  {primaryResume ? "Primary resume synced" : "Resume upload pending"}
                </h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  {primaryResume
                    ? `${primaryResume.name} is marked primary and will power future application snapshots.`
                    : "Upload a primary resume so every new application snapshot stays consistent."}
                </p>
                <Link className="mt-4 inline-flex" to="/student/documents">
                  <Button variant="secondary">Open vault</Button>
                </Link>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="panel-hover p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary-fixed p-3 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Upcoming moments</p>
                <div className="mt-4 space-y-3">
                  {(profile?.upcomingEvents || []).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-[1.1rem] bg-surface-container-low px-4 py-3"
                    >
                      <p className="font-semibold text-on-surface">{event.title}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{event.schedule}</p>
                    </div>
                  ))}
                  {(profile?.upcomingEvents || []).length === 0 && (
                    <p className="text-sm text-on-surface-variant">No upcoming events scheduled.</p>
                  )}
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </motion.section>

      {/* Featured Jobs */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        animate="show"
        className="page-section space-y-5"
      >
        <SectionHeading
          label="Featured Matches"
          title="High-signal roles you can act on now"
          description="A compact shortlist of recruiter-fit opportunities aligned to your current academic and document profile."
        />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-6 lg:grid-cols-2"
          >
            {featuredJobs.map((job) => (
              <motion.div key={job.id} variants={fadeUp}>
                <JobCard job={job} />
              </motion.div>
            ))}
          </motion.div>

          <SurfaceCard className="p-6">
            <h3 className="font-headline text-2xl font-bold">Application movement</h3>
            <div className="mt-5 space-y-3">
              {applications.slice(0, 3).map((application) => (
                <div
                  key={application.id}
                  className="interactive-strip rounded-[1.2rem] bg-surface-container-low p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-on-surface">{application.role}</p>
                      <p className="mt-1 text-sm text-primary">{application.company}</p>
                    </div>
                    <ApplicationStatusBadge status={application.status} />
                  </div>
                  <p className="mt-3 text-sm text-on-surface-variant">{application.phase}</p>
                </div>
              ))}
              {applications.length === 0 && (
                <p className="text-sm text-on-surface-variant">No applications yet.</p>
              )}
            </div>
          </SurfaceCard>
        </div>
      </motion.section>

      {/* Timeline */}
      <motion.section
        variants={sectionFade}
        initial="hidden"
        animate="show"
        className="page-section space-y-5"
      >
        <SectionHeading
          label="Timeline"
          title="Recent application movement"
          description="A clean recruiter-side read of your latest progress across active applications."
        />

        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4">
          {applications.map((application) => (
            <motion.div key={application.id} variants={fadeUp}>
              <SurfaceCard className="panel-hover p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-headline text-2xl font-bold text-on-surface">
                      {application.role}
                    </p>
                    <p className="mt-1 text-sm font-medium text-primary">{application.company}</p>
                    <p className="mt-2 text-sm text-on-surface-variant">{application.phase}</p>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="rounded-full bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant">
                      Applied {application.appliedOn}
                    </div>
                    <ApplicationStatusBadge status={application.status} />
                  </div>
                </div>
              </SurfaceCard>
            </motion.div>
          ))}
          {applications.length === 0 && (
            <SurfaceCard className="p-8 text-center">
              <p className="text-on-surface-variant">No applications to show yet.</p>
            </SurfaceCard>
          )}
        </motion.div>
      </motion.section>
    </div>
  );
}
