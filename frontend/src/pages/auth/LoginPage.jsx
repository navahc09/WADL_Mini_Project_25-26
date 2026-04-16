import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Hash, Lock, Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
import BrandMark from "../../components/BrandMark";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";

const studentSchema = z.object({
  enrollmentNo: z.string().min(3, "Enter your enrollment number (e.g. I2K231262)"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const adminSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.07 },
  }),
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);

  const isStudent = role === "student";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(isStudent ? studentSchema : adminSchema) });

  function switchRole(newRole) {
    setRole(newRole);
    reset();
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = isStudent
        ? { enrollmentNo: values.enrollmentNo.toUpperCase(), password: values.password }
        : { email: values.email, password: values.password };

      const user = await login(payload);
      toast.success(`${user.role === "admin" ? "Admin" : "Student"} access granted.`);
      navigate(user.role === "admin" ? "/admin" : "/student");
    } catch (error) {
      const message = error?.response?.data?.error || "Unable to sign in right now.";
      toast.error(message);
    }
  });

  return (
    <div className="h-screen overflow-hidden bg-surface">
      <div className="grid h-full md:grid-cols-[1fr_1.1fr]">

        {/* ── Left hero panel ── */}
        <motion.aside
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative hidden overflow-hidden bg-signature md:flex md:flex-col md:justify-between p-10 lg:p-14"
        >
          <div className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <BrandMark compact inverted />
          </div>

          <div className="relative space-y-6">
            <div className="space-y-4">
              <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                TNP Connect
              </span>
              <h1 className="font-headline text-4xl font-extrabold leading-[1.08] text-white lg:text-5xl">
                Your career, curated with editorial clarity.
              </h1>
              <p className="max-w-sm text-sm leading-7 text-white/70">
                Sign in to explore roles, track applications, and drive placement operations from one
                polished campus platform.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "77%", label: "Placement rate" },
                { value: "18+", label: "Active roles" },
                { value: "1,912", label: "Placed this season" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm">
                  <p className="font-headline text-2xl font-extrabold text-white">{s.value}</p>
                  <p className="mt-1 text-xs text-white/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-[1.4rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-3">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Placement Snapshot</p>
                <p className="text-xs text-white/60">85% of shortlisted students had complete profiles</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-white/15">
              <div className="h-full w-[85%] rounded-full bg-white" />
            </div>
          </div>
        </motion.aside>

        {/* ── Right form panel ── */}
        <motion.main
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="flex h-full flex-col overflow-y-auto bg-surface px-6 py-8 md:px-12 lg:px-16"
        >
          <div className="mb-8 md:hidden">
            <BrandMark />
          </div>

          <div className="my-auto w-full max-w-md mx-auto space-y-7">

            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="space-y-2">
              <span className="section-label">Sign In</span>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                Welcome back
              </h2>
              <p className="text-sm leading-6 text-on-surface-variant">
                Enter your credentials to access your campus placement workspace.
              </p>
            </motion.div>

            {/* Role toggle */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="flex rounded-2xl bg-surface-container-low p-1">
              {[
                { value: "student", label: "Student Login" },
                { value: "admin", label: "Placement Cell" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    role === option.value
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  onClick={() => switchRole(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>

            {/* Form */}
            <motion.form custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-4" onSubmit={onSubmit}>

              {isStudent ? (
                /* Enrollment number field */
                <div className="space-y-1.5">
                  <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                    Enrollment Number
                  </label>
                  <div className="field-shell flex items-center gap-3">
                    <Hash className="h-4 w-4 shrink-0 text-outline" />
                    <input
                      className="w-full bg-transparent outline-none uppercase"
                      placeholder="e.g. I2K231262"
                      autoComplete="username"
                      {...register("enrollmentNo")}
                    />
                  </div>
                  {errors.enrollmentNo && (
                    <p className="ml-1 text-xs font-medium text-error">{errors.enrollmentNo.message}</p>
                  )}
                </div>
              ) : (
                /* Admin email field */
                <div className="space-y-1.5">
                  <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                    Admin Email
                  </label>
                  <div className="field-shell flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-outline" />
                    <input
                      className="w-full bg-transparent outline-none"
                      placeholder="placement@university.edu"
                      autoComplete="email"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="ml-1 text-xs font-medium text-error">{errors.email.message}</p>
                  )}
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                  Password
                </label>
                <div className="field-shell flex items-center gap-3">
                  <Lock className="h-4 w-4 shrink-0 text-outline" />
                  <input
                    className="w-full bg-transparent outline-none"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="shrink-0 text-outline transition-colors hover:text-on-surface"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="ml-1 text-xs font-medium text-error">{errors.password.message}</p>
                )}
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : "Sign in to portal"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.form>

            {/* Forgot password notice */}
            {isStudent && (
              <motion.div
                custom={3} variants={fadeUp} initial="hidden" animate="show"
                className="rounded-2xl border border-outline-variant/40 bg-surface-container-low px-5 py-4"
              >
                <p className="text-sm font-semibold text-on-surface">Forgot your password?</p>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                  Contact the TnP office — they will send a password reset link to your registered
                  email address. You cannot reset your password on your own.
                </p>
              </motion.div>
            )}

            {/* Account note for students */}
            {isStudent && (
              <motion.p custom={4} variants={fadeUp} initial="hidden" animate="show" className="text-center text-xs leading-5 text-outline">
                Your account is created by the TnP office. If you haven't received your setup
                email, contact the placement cell.
              </motion.p>
            )}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
