import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  BriefcaseBusiness,
  ChartSpline,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import Button from "../components/ui/Button";
import SectionHeading from "../components/ui/SectionHeading";
import SurfaceCard from "../components/ui/SurfaceCard";
import FloatingParticles, { FloatingOrbs } from "../components/FloatingParticles";
import { useAuth } from "../hooks/useAuth";

const PLATFORM_STATS = [
  { value: 1912, suffix: "+", label: "Students placed this season" },
  { value: 18, suffix: "", label: "Live campus opportunities" },
  { value: 77, suffix: "%", label: "Average placement rate" },
];

const FEATURED_COMPANIES = ["Google", "Microsoft", "Amazon", "Adobe", "Infosys", "Wipro"];

const PLATFORM_HIGHLIGHTS = [
  {
    title: "Eligibility Intelligence",
    description:
      "Students see which roles they qualify for instantly based on branch, CGPA, and graduation year — no manual cross-referencing needed.",
    icon: ShieldCheck,
    gradient: "from-blue-500/10 to-primary/5",
  },
  {
    title: "Snapshot Applications",
    description:
      "Every application is an immutable snapshot of the student's profile, resume, and academic record at the time of submission.",
    icon: Blocks,
    gradient: "from-purple-500/10 to-tertiary-fixed/30",
  },
  {
    title: "Placement Analytics",
    description:
      "Placement officers get branch-wise analytics, funnel views, and salary distribution reports to run a smarter hiring cycle.",
    icon: ChartSpline,
    gradient: "from-emerald-500/10 to-primary-fixed/30",
  },
];

const JOURNEY_STEPS = [
  { step: "01", title: "Discover", desc: "Find roles and see eligibility instantly" },
  { step: "02", title: "Apply", desc: "Submit snapshot-safe applications with current documents" },
  { step: "03", title: "Track", desc: "Review shortlists, interview rounds, and recruiter updates" },
  { step: "04", title: "Succeed", desc: "Measure placement outcomes and improve the next cycle" },
];

// ── Animation presets ──
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

// ── Animated stat counter ──
function AnimatedStat({ value, suffix, label, delay = 0 }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <SurfaceCard className="p-5 cursor-default">
        <motion.p
          className="text-3xl font-extrabold text-primary"
          onViewportEnter={() => {
            if (started) return;
            setStarted(true);
            let start = 0;
            const end = value;
            const duration = 1400;
            const step = (end / duration) * 16;
            const timer = setInterval(() => {
              start += step;
              if (start >= end) { setCount(end); clearInterval(timer); }
              else setCount(Math.floor(start));
            }, 16);
          }}
        >
          {count.toLocaleString()}{suffix}
        </motion.p>
        <p className="mt-2 text-sm text-on-surface-variant">{label}</p>
      </SurfaceCard>
    </motion.div>
  );
}

// ── Mouse-parallax hero card ──
function ParallaxCard({ children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 30 });

  function handleMouse(e) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className="cursor-default"
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const homePath = user?.role === "admin" ? "/admin" : "/student";

  return (
    <div className="editorial-shell min-h-screen overflow-x-hidden">

      {/* ── Nav ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-30 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6"
      >
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
          <BrandMark />
        </motion.div>
        <div className="flex items-center gap-3">
          <Link className="hidden md:block" to="/login">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="ghost">Sign In</Button>
            </motion.div>
          </Link>
          <Link to={user ? homePath : "/register"}>
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
            >
              <Button>
                {user ? "Open Workspace" : "Join TNP Connect"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl space-y-28 px-4 pb-20 pt-8 md:px-6">

        {/* ── Hero ── */}
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
            {/*<motion.span
              variants={fadeUp}
              custom={0}
              className="section-label inline-flex items-center gap-2"
            >
              <motion.span
                animate={{ rotate: [0, 15, -10, 15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Zap className="h-3 w-3 text-primary" />
              </motion.span>
              Placement Platform
            </motion.span>*/}

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-headline text-5xl font-extrabold leading-[1.04] tracking-tight text-on-surface md:text-7xl"
            >
              A curated campus career platform built for{" "}
              <span className="relative">
                <span className="relative z-10 text-primary">students</span>
                <motion.span
                  className="absolute inset-x-0 bottom-0 h-3 bg-primary/15 rounded"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ originX: 0 }}
                />
              </span>
              {", recruiters, and placement teams."}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="max-w-2xl text-lg leading-8 text-on-surface-variant md:text-xl"
            >
              TNP Connect turns spreadsheets and fragmented updates into one premium placement
              experience with eligibility intelligence, immutable application snapshots, and
              beautiful decision-ready workflows.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col gap-4 sm:flex-row">
              <Link to={user ? homePath : "/register"}>
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg">
                    {user ? "Continue to dashboard" : "Start as a student"}
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Button>
                </motion.div>
              </Link>
              <Link to="/login">
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" variant="secondary">Placement cell sign in</Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Animated stats */}
            <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-3">
              {PLATFORM_STATS.map((stat, i) => (
                <AnimatedStat key={stat.label} delay={i} {...stat} />
              ))}
            </motion.div>
          </motion.div>

          {/* Hero cockpit card with parallax */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <ParallaxCard>
              <SurfaceCard className="relative overflow-hidden p-7 md:p-8">
                <FloatingOrbs />

                <div className="relative space-y-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary">Live Placement Health</p>
                      <h2 className="mt-1 font-headline text-3xl font-extrabold">Career cockpit</h2>
                    </div>
                    <motion.div
                      className="rounded-full bg-primary-fixed px-4 py-2 text-sm font-bold text-primary"
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      77% placed
                    </motion.div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <motion.div
                      className="rounded-[1.2rem] bg-surface-container-low p-5"
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    >
                      <p className="text-sm text-on-surface-variant">Top student readiness</p>
                      <p className="mt-2 font-headline text-4xl font-extrabold">92%</p>
                      <p className="mt-2 text-sm text-on-surface-variant">
                        Profile completeness for high-conversion applicants.
                      </p>
                    </motion.div>
                    <motion.div
                      className="rounded-[1.2rem] bg-signature p-5 text-white"
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    >
                      <p className="text-sm text-white/70">Average package</p>
                      <p className="mt-2 font-headline text-4xl font-extrabold">8.4L</p>
                      <p className="mt-2 text-sm text-white/75">Across the current placement cycle.</p>
                    </motion.div>
                  </div>

                  <div className="rounded-[1.4rem] bg-surface-container-low p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">Featured recruiter set</p>
                        <p className="text-sm text-on-surface-variant">Companies active this week</p>
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 15, -10, 15, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <Sparkles className="h-5 w-5 text-primary" />
                      </motion.div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {FEATURED_COMPANIES.map((company, i) => (
                        <motion.span
                          key={company}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                          whileHover={{ scale: 1.07, y: -2 }}
                          className="cursor-default rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant"
                        >
                          {company}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </ParallaxCard>
          </motion.div>
        </section>

        {/* ── Platform highlights ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-10"
        >
          <motion.div variants={fadeUp} custom={0}>
            <SectionHeading
              label="System Value"
              title="Placement operations that feel deliberate, not improvised"
              description="Designed around the actual pressure points of college placements: fragmented records, eligibility confusion, and review bottlenecks."
            />
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-6 md:grid-cols-3"
          >
            {PLATFORM_HIGHLIGHTS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
                >
                  <SurfaceCard className={`p-7 h-full bg-gradient-to-br ${item.gradient} relative overflow-hidden`}>
                    <motion.div
                      className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary"
                      whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <h3 className="font-headline text-2xl font-bold">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-on-surface-variant">{item.description}</p>
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
          <motion.div
            variants={fadeUp}
            custom={0}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
          >
            <SurfaceCard className="p-8 h-full">
              <div className="space-y-5">
                <span className="section-label">For Students</span>
                <h3 className="font-headline text-4xl font-extrabold">
                  Discover where your profile has the highest signal.
                </h3>
                <div className="space-y-4 text-sm leading-7 text-on-surface-variant">
                  {[
                    "Instant eligibility clarity by branch, CGPA, and role requirements.",
                    "Clean application timelines with shortlist, interview, and offer visibility.",
                    "Secure document vault for resumes, marksheets, and placement proofs.",
                  ].map((text, i) => (
                    <motion.p
                      key={i}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                    >
                      <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      {text}
                    </motion.p>
                  ))}
                </div>
                <Link to="/register">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="secondary">
                      Register as student <GraduationCap className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </SurfaceCard>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={1}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
          >
            <div className="h-full rounded-[1.7rem] bg-signature p-[1px] shadow-halo">
              <div className="relative h-full rounded-[1.65rem] bg-slate-950 px-8 py-9 text-white overflow-hidden">
                <FloatingParticles count={20} color="255,255,255" />
                <div className="relative z-10">
                  <span className="section-label bg-white/10 text-white">For Placement Cell</span>
                  <h3 className="mt-5 font-headline text-4xl font-extrabold">
                    Publish, review, shortlist, and report from one control layer.
                  </h3>
                  <div className="mt-6 space-y-4 text-sm leading-7 text-white/75">
                    {[
                      "Maintain recruiter-ready job inventory with deadlines and applicant volume.",
                      "Review students using immutable application snapshots and exportable data.",
                      "Track season performance with branch-wise and funnel-level analytics.",
                    ].map((text, i) => (
                      <motion.p
                        key={i}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                      >
                        <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-blue-300" />
                        {text}
                      </motion.p>
                    ))}
                  </div>
                  <Link className="mt-7 inline-flex" to="/login">
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button variant="tertiary">
                        Open admin sign in <BriefcaseBusiness className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ── Journey steps ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-10"
        >
          <motion.div variants={fadeUp} custom={0}>
            <SectionHeading
              label="Journey"
              title="A single flow from opportunity discovery to offer outcome"
              description="Every actor moves through the placement cycle with less friction and better context."
            />
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="grid gap-5 md:grid-cols-4"
          >
            {JOURNEY_STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.22 } }}
              >
                <SurfaceCard className="p-6 h-full relative overflow-hidden">
                  {/* Connector line */}
                  {i < JOURNEY_STEPS.length - 1 && (
                    <div className="absolute right-0 top-1/2 hidden h-[1px] w-5 -translate-y-1/2 bg-outline-variant/30 md:block" />
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary font-headline text-sm font-extrabold text-white">
                    {step.step}
                  </div>
                  <h4 className="mt-4 font-headline text-lg font-bold text-on-surface">{step.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{step.desc}</p>
                </SurfaceCard>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* ── CTA banner ── */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative overflow-hidden rounded-[2rem] bg-signature px-8 py-12 text-white md:px-14">
            <FloatingParticles count={32} color="255,255,255" />
            <FloatingOrbs inverted />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <motion.p
                  className="text-sm font-bold uppercase tracking-[0.25em] text-white/60"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  Ready to get started?
                </motion.p>
                <h2 className="max-w-3xl font-headline text-4xl font-extrabold leading-tight">
                  One platform. Every stage of the campus placement cycle — from discovery to offer.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-white/70">
                  Join students and placement officers already using TNP Connect to run cleaner,
                  faster, and more transparent campus hiring cycles.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link to="/register">
                  <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="secondary" size="lg">Start as student</Button>
                  </motion.div>
                </Link>
                <Link to="/login">
                  <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                      Sign in to portal
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
