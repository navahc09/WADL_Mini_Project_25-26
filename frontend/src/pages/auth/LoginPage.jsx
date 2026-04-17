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
import FloatingParticles, { FloatingOrbs } from "../../components/FloatingParticles";

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

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};

const statCard = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
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
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative hidden overflow-hidden bg-signature md:flex md:flex-col md:justify-between p-10 lg:p-14"
        >
          {/* Animated background layers */}
          <FloatingOrbs />
          <FloatingParticles count={32} color="255,255,255" />

          {/* Gradient blobs */}
          <motion.div
            className="pointer-events-none absolute -top-16 -left-16 h-80 w-80 rounded-full bg-white/8 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-white/8 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.12, 0.08] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />

          <div className="relative">
            <BrandMark compact inverted />
          </div>

          <div className="relative space-y-6">
            <div className="space-y-4">
              <motion.span
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70"
              >
                TNP Connect
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="font-headline text-4xl font-extrabold leading-[1.08] text-white lg:text-5xl"
              >
                Your career, curated with editorial clarity.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="max-w-sm text-sm leading-7 text-white/70"
              >
                Sign in to explore roles, track applications, and drive placement operations from one
                polished campus platform.
              </motion.p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-3 gap-3"
            >
              {[
                { value: "77%", label: "Placement rate" },
                { value: "18+", label: "Active roles" },
                { value: "1,912", label: "Placed this season" },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  variants={statCard}
                  whileHover={{ scale: 1.06, backgroundColor: "rgba(255,255,255,0.18)" }}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm cursor-default"
                >
                  <p className="font-headline text-2xl font-extrabold text-white">{s.value}</p>
                  <p className="mt-1 text-xs text-white/60">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="relative rounded-[1.4rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="rounded-2xl bg-white/15 p-3"
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-white">Placement Snapshot</p>
                <p className="text-xs text-white/60">85% of shortlisted students had complete profiles</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: "85%" }}
                transition={{ duration: 1.2, delay: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
          </motion.div>
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
                <motion.button
                  key={option.value}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    role === option.value
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  onClick={() => switchRole(option.value)}
                >
                  {option.label}
                </motion.button>
              ))}
            </motion.div>

            {/* Form */}
            <motion.form custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-4" onSubmit={onSubmit}>

              {isStudent ? (
                <motion.div
                  key="enrollment"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1.5"
                >
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
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ml-1 text-xs font-medium text-error"
                    >
                      {errors.enrollmentNo.message}
                    </motion.p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1.5"
                >
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
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ml-1 text-xs font-medium text-error"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </motion.div>
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
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    className="shrink-0 text-outline transition-colors hover:text-on-surface"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </motion.button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ml-1 text-xs font-medium text-error"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in…" : "Sign in to portal"}
                  <motion.span
                    animate={isSubmitting ? {} : { x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Button>
              </motion.div>
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
