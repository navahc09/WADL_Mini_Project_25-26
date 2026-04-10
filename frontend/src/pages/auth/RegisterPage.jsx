import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
import BrandMark from "../../components/BrandMark";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().min(10, "Enter a valid phone number"),
  rollNumber: z.string().min(3, "Enter a roll number"),
  branch: z.string().min(1, "Select a branch"),
  graduationYear: z.string().min(1, "Select a graduation year"),
  cgpa: z.coerce.number().min(0).max(10),
});

const BRANCH_OPTIONS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Artificial Intelligence & Data Science",
];

const GRADUATION_YEARS = ["2025", "2026", "2027", "2028"];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.08 },
  }),
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerStudent } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerStudent(values);
      toast.success("Student profile initialized successfully.");
      navigate("/student");
    } catch (error) {
      const message = error?.response?.data?.error || "Registration could not be completed.";
      toast.error(message);
    }
  });

  return (
    <div className="h-screen overflow-hidden bg-surface">
      <div className="grid h-full md:grid-cols-[0.8fr_1.2fr]">

        {/* ── Left hero panel ── */}
        <motion.aside
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative hidden overflow-hidden bg-signature md:flex md:flex-col md:justify-between p-10 lg:p-12"
        >
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          {/* Brand */}
          <div className="relative">
            <BrandMark compact inverted />
          </div>

          {/* Hero copy */}
          <div className="relative space-y-6">
            <div className="space-y-4">
              <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                Student Registration
              </span>
              <h1 className="font-headline text-4xl font-extrabold leading-[1.08] text-white lg:text-5xl">
                Your career masterpiece starts here.
              </h1>
              <p className="max-w-sm text-sm leading-7 text-white/70">
                Join a curated campus ecosystem that helps you discover, apply, and grow with more
                clarity than the usual placement scramble.
              </p>
            </div>

            {/* Feature list */}
            <div className="grid gap-3">
              {[
                "Verified campus opportunities",
                "Real-time application tracking",
                "Direct academic profile integration",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white/80" />
                  <span className="text-sm text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className="relative rounded-[1.4rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-sm font-semibold text-white">2,000+ students joined this semester</p>
            <p className="mt-1 text-xs text-white/60">Build your profile once — stay visible all season.</p>
          </div>
        </motion.aside>

        {/* ── Right form panel ── */}
        <motion.main
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="flex h-full flex-col overflow-y-auto bg-surface px-6 py-8 md:px-10 lg:px-14"
        >
          {/* Mobile brand */}
          <div className="mb-6 md:hidden">
            <BrandMark />
          </div>

          {/* Form content */}
          <div className="w-full max-w-2xl mx-auto space-y-6">

            {/* Heading */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="space-y-2">
              <span className="section-label">Student Registration</span>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                Create your profile
              </h2>
              <p className="text-sm leading-6 text-on-surface-variant">
                Build the academic and identity layer recruiters will see when you apply.
              </p>
            </motion.div>

            <form className="space-y-5" onSubmit={onSubmit}>

              {/* Section 1 — Account Credentials */}
              <motion.div
                custom={1} variants={fadeUp} initial="hidden" animate="show"
                className="rounded-[1.4rem] border border-outline-variant/30 bg-surface-container-lowest p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary">
                    1
                  </div>
                  <h3 className="font-headline text-xl font-bold text-on-surface">
                    Account Credentials
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                      Email Address
                    </label>
                    <div className="field-shell flex items-center gap-3">
                      <Mail className="h-4 w-4 shrink-0 text-outline" />
                      <input
                        className="w-full bg-transparent outline-none"
                        placeholder="name@university.edu"
                        autoComplete="email"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <p className="ml-1 text-xs font-medium text-error">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                      Password
                    </label>
                    <div className="field-shell flex items-center gap-3">
                      <Lock className="h-4 w-4 shrink-0 text-outline" />
                      <input
                        className="w-full bg-transparent outline-none"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...register("password")}
                      />
                    </div>
                    {errors.password ? (
                      <p className="ml-1 text-xs font-medium text-error">{errors.password.message}</p>
                    ) : (
                      <p className="ml-1 text-xs text-outline">Minimum 8 characters.</p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Section 2 — Personal Identity */}
              <motion.div
                custom={2} variants={fadeUp} initial="hidden" animate="show"
                className="rounded-[1.4rem] border border-outline-variant/30 bg-surface-container-lowest p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary">
                    2
                  </div>
                  <h3 className="font-headline text-xl font-bold text-on-surface">
                    Personal Identity
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                      Full Name
                    </label>
                    <div className="field-shell flex items-center gap-3">
                      <UserRound className="h-4 w-4 shrink-0 text-outline" />
                      <input
                        className="w-full bg-transparent outline-none"
                        placeholder="Your full name"
                        autoComplete="name"
                        {...register("fullName")}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="ml-1 text-xs font-medium text-error">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                      Phone Number
                    </label>
                    <div className="field-shell flex items-center gap-3">
                      <Phone className="h-4 w-4 shrink-0 text-outline" />
                      <input
                        className="w-full bg-transparent outline-none"
                        placeholder="+91 00000 00000"
                        autoComplete="tel"
                        {...register("phone")}
                      />
                    </div>
                    {errors.phone && (
                      <p className="ml-1 text-xs font-medium text-error">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Section 3 — Academic Portfolio */}
              <motion.div
                custom={3} variants={fadeUp} initial="hidden" animate="show"
                className="rounded-[1.4rem] border border-outline-variant/30 bg-surface-container-lowest p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary">
                    3
                  </div>
                  <h3 className="font-headline text-xl font-bold text-on-surface">
                    Academic Portfolio
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                      Roll Number
                    </label>
                    <input
                      className="field-shell w-full"
                      placeholder="e.g. CSE2026-001"
                      {...register("rollNumber")}
                    />
                    {errors.rollNumber && (
                      <p className="ml-1 text-xs font-medium text-error">{errors.rollNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                      Academic Branch
                    </label>
                    <select className="field-shell w-full" {...register("branch")}>
                      <option value="">Select branch</option>
                      {BRANCH_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {errors.branch && (
                      <p className="ml-1 text-xs font-medium text-error">{errors.branch.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                      Graduation Year
                    </label>
                    <select className="field-shell w-full" {...register("graduationYear")}>
                      <option value="">Select year</option>
                      {GRADUATION_YEARS.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    {errors.graduationYear && (
                      <p className="ml-1 text-xs font-medium text-error">{errors.graduationYear.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                      Current CGPA
                    </label>
                    <input
                      className="field-shell w-full"
                      step="0.01"
                      type="number"
                      placeholder="e.g. 8.5"
                      {...register("cgpa")}
                    />
                    {errors.cgpa && (
                      <p className="ml-1 text-xs font-medium text-error">{errors.cgpa.message}</p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div
                custom={4} variants={fadeUp} initial="hidden" animate="show"
                className="flex flex-col gap-3 sm:flex-row"
              >
                <Button className="flex-1" size="lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account…" : "Initialize Account"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link to="/login">
                  <Button className="w-full sm:w-auto" size="lg" variant="secondary">
                    Already have access?
                  </Button>
                </Link>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.p
              custom={5} variants={fadeUp} initial="hidden" animate="show"
              className="pb-4 text-center text-xs leading-6 text-outline"
            >
              By registering, you agree to our{" "}
              <span className="font-semibold text-primary">Terms of Excellence</span> and{" "}
              <span className="font-semibold text-primary">Career Privacy Policy</span>.
            </motion.p>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
