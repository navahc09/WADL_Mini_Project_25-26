import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  BriefcaseBusiness,
  ChartSpline,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import Button from "../components/ui/Button";
import SectionHeading from "../components/ui/SectionHeading";
import SurfaceCard from "../components/ui/SurfaceCard";
import { useAuth } from "../hooks/useAuth";

// ── Static platform data (marketing content, not backend data) ──
const PLATFORM_STATS = [
  { value: "1,912+", label: "Students placed this season" },
  { value: "18", label: "Live campus opportunities" },
  { value: "77%", label: "Average placement rate" },
];

const FEATURED_COMPANIES = [
  "Google", "Microsoft", "Amazon", "Adobe", "Infosys", "Wipro",
];

const PLATFORM_HIGHLIGHTS = [
  {
    title: "Eligibility Intelligence",
    description:
      "Students see which roles they qualify for instantly based on branch, CGPA, and graduation year — no manual cross-referencing needed.",
  },
  {
    title: "Snapshot Applications",
    description:
      "Every application is an immutable snapshot of the student's profile, resume, and academic record at the time of submission.",
  },
  {
    title: "Placement Analytics",
    description:
      "Placement officers get branch-wise analytics, funnel views, and salary distribution reports to run a smarter hiring cycle.",
  },
];

const JOURNEY_STEPS = [
  "Discover roles and see eligibility instantly",
  "Submit snapshot-safe applications with current documents",
  "Review shortlists, interview rounds, and recruiter updates",
  "Measure placement outcomes and improve the next cycle",
];

// ── Animation variants ──
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const inView = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function LandingPage() {
  const { user } = useAuth();
  const homePath = user?.role === "admin" ? "/admin" : "/student";

  return (
    <div className="editorial-shell min-h-screen">
      {/* ── Nav ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6"
      >
        <BrandMark />
        <div className="flex items-center gap-3">
          <Link className="hidden md:block" to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to={user ? homePath : "/register"}>
            <Button>
              {user ? "Open Workspace" : "Join TNP Connect"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl space-y-24 px-4 pb-20 pt-8 md:px-6">

        {/* ── Hero ── */}
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            <motion.span variants={fadeUp} className="section-label inline-block">
              Placement Platform
            </motion.span>

            <motion.div variants={fadeUp} className="space-y-5">
              <h1 className="font-headline text-5xl font-extrabold leading-[1.04] tracking-tight text-on-surface md:text-7xl">
                A curated campus career platform built for students, recruiters, and placement teams.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-on-surface-variant md:text-xl">
                TNP Connect turns spreadsheets and fragmented updates into one premium placement
                experience with eligibility intelligence, immutable application snapshots, and
                beautiful decision-ready workflows.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row">
              <Link to={user ? homePath : "/register"}>
                <Button size="lg">
                  {user ? "Continue to dashboard" : "Start as a student"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">
                  Placement cell sign in
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-3">
              {PLATFORM_STATS.map((stat) => (
                <motion.div key={stat.label} variants={fadeUp}>
                  <SurfaceCard className="p-5">
                    <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
                    <p className="mt-2 text-sm text-on-surface-variant">{stat.label}</p>
                  </SurfaceCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero cockpit card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
          >
            <SurfaceCard className="relative overflow-hidden p-7 md:p-8">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-tertiary-fixed blur-3xl" />

              <div className="relative space-y-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">Live Placement Health</p>
                    <h2 className="mt-1 font-headline text-3xl font-extrabold">Career cockpit</h2>
                  </div>
                  <div className="rounded-full bg-primary-fixed px-4 py-2 text-sm font-bold text-primary">
                    77% placed
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] bg-surface-container-low p-5">
                    <p className="text-sm text-on-surface-variant">Top student readiness</p>
                    <p className="mt-2 font-headline text-4xl font-extrabold">92%</p>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Profile completeness for high-conversion applicants.
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-signature p-5 text-white">
                    <p className="text-sm text-white/70">Average package</p>
                    <p className="mt-2 font-headline text-4xl font-extrabold">8.4L</p>
                    <p className="mt-2 text-sm text-white/75">
                      Across the current placement cycle.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.4rem] bg-surface-container-low p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Featured recruiter set</p>
                      <p className="text-sm text-on-surface-variant">
                        Companies active on the board this week
                      </p>
                    </div>
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {FEATURED_COMPANIES.map((company) => (
                      <span
                        key={company}
                        className="rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </motion.div>
        </section>

        {/* ── Platform highlights ── */}
        <motion.section
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-10"
        >
          <SectionHeading
            label="System Value"
            title="Placement operations that feel deliberate, not improvised"
            description="The platform is designed around the actual pressure points of college placements: fragmented records, eligibility confusion, and review bottlenecks."
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-6 md:grid-cols-3"
          >
            {PLATFORM_HIGHLIGHTS.map((item, index) => {
              const icons = [ShieldCheck, ChartSpline, Blocks];
              const Icon = icons[index];
              return (
                <motion.div key={item.title} variants={fadeUp}>
                  <SurfaceCard className="p-7 h-full">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-headline text-2xl font-bold">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                      {item.description}
                    </p>
                  </SurfaceCard>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* ── For students / For placement cell ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <motion.div variants={fadeUp}>
            <SurfaceCard className="p-8 h-full">
              <div className="space-y-5">
                <span className="section-label">For Students</span>
                <h3 className="font-headline text-4xl font-extrabold">
                  Discover where your profile has the highest signal.
                </h3>
                <div className="space-y-4 text-sm leading-7 text-on-surface-variant">
                  <p className="flex items-start gap-3">
                    <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    Instant eligibility clarity by branch, CGPA, and role requirements.
                  </p>
                  <p className="flex items-start gap-3">
                    <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    Clean application timelines with shortlist, interview, and offer visibility.
                  </p>
                  <p className="flex items-start gap-3">
                    <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    Secure document vault for resumes, marksheets, and placement proofs.
                  </p>
                </div>
                <Link to="/register">
                  <Button variant="secondary">
                    Register as student
                    <GraduationCap className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </SurfaceCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="h-full rounded-[1.7rem] bg-signature p-[1px] shadow-halo">
              <div className="h-full rounded-[1.65rem] bg-slate-950 px-8 py-9 text-white">
                <span className="section-label bg-white/10 text-white">For Placement Cell</span>
                <h3 className="mt-5 font-headline text-4xl font-extrabold">
                  Publish, review, shortlist, and report from one control layer.
                </h3>
                <div className="mt-6 space-y-4 text-sm leading-7 text-white/75">
                  <p className="flex items-start gap-3">
                    <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-blue-300" />
                    Maintain recruiter-ready job inventory with deadlines and applicant volume.
                  </p>
                  <p className="flex items-start gap-3">
                    <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-blue-300" />
                    Review students using immutable application snapshots and exportable data.
                  </p>
                  <p className="flex items-start gap-3">
                    <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-blue-300" />
                    Track season performance with branch-wise and funnel-level analytics.
                  </p>
                </div>
                <Link className="mt-7 inline-flex" to="/login">
                  <Button variant="tertiary">
                    Open admin sign in
                    <BriefcaseBusiness className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ── Journey steps ── */}
        <motion.section
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-10"
        >
          <SectionHeading
            label="Journey"
            title="A single flow from opportunity discovery to offer outcome"
            description="The frontend is structured so every actor can move through the placement cycle with less friction and better context."
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid gap-5 md:grid-cols-4"
          >
            {JOURNEY_STEPS.map((step, index) => (
              <motion.div key={step} variants={fadeUp}>
                <SurfaceCard className="p-6 h-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low font-headline text-lg font-extrabold text-primary">
                    {index + 1}
                  </div>
                  <p className="mt-5 text-sm leading-7 text-on-surface-variant">{step}</p>
                </SurfaceCard>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* ── CTA banner ── */}
        <motion.section
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-[2rem] bg-signature px-8 py-10 text-white md:px-12"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/70">
                Ready to get started?
              </p>
              <h2 className="max-w-3xl font-headline text-4xl font-extrabold leading-tight">
                One platform. Every stage of the campus placement cycle — from discovery to offer.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/75">
                Join students and placement officers already using TNP Connect to run cleaner,
                faster, and more transparent campus hiring cycles.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  Start as student
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" className="bg-white text-primary hover:scale-[1.01]">
                  Sign in to portal
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
