import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
import axios from "axios";
import BrandMark from "../../components/BrandMark";
import Button from "../../components/ui/Button";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.08 },
  }),
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      toast.error("Invalid reset link. Please contact the TnP office.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, {
        token,
        password: values.password,
      });
      setDone(true);
      toast.success("Password reset successfully!");
    } catch (error) {
      const message = error?.response?.data?.error || "Reset link is invalid or has expired.";
      toast.error(message);
    }
  });

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md space-y-8"
      >
        <div>
          <BrandMark />
        </div>

        {done ? (
          <div className="rounded-[1.4rem] border border-outline-variant/30 bg-surface-container-lowest p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Password reset successfully
            </h2>
            <p className="text-sm leading-6 text-on-surface-variant">
              You can now sign in with your enrollment number and your new password.
            </p>
            <Link to="/login">
              <Button className="w-full mt-2" size="lg">
                Go to Login
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-outline-variant/30 bg-surface-container-lowest p-8 space-y-6">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="space-y-1">
              <span className="section-label">Password Reset</span>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                Choose a new password
              </h2>
              <p className="text-sm leading-6 text-on-surface-variant">
                This link was sent to you by the TnP office. Enter a new password below.
              </p>
            </motion.div>

            {!token && (
              <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
                This reset link is missing or invalid. Please contact the TnP office for a new link.
              </div>
            )}

            <motion.form
              custom={1} variants={fadeUp} initial="hidden" animate="show"
              className="space-y-4"
              onSubmit={onSubmit}
            >
              <div className="space-y-1.5">
                <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                  New Password
                </label>
                <div className="field-shell flex items-center gap-3">
                  <KeyRound className="h-4 w-4 shrink-0 text-outline" />
                  <input
                    className="w-full bg-transparent outline-none"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
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
                {errors.password ? (
                  <p className="ml-1 text-xs font-medium text-error">{errors.password.message}</p>
                ) : (
                  <p className="ml-1 text-xs text-outline">Minimum 8 characters.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 block text-sm font-medium text-on-surface-variant">
                  Confirm New Password
                </label>
                <div className="field-shell flex items-center gap-3">
                  <KeyRound className="h-4 w-4 shrink-0 text-outline" />
                  <input
                    className="w-full bg-transparent outline-none"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="ml-1 text-xs font-medium text-error">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting || !token}>
                {isSubmitting ? "Resetting password…" : "Reset Password"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.form>

            <p className="text-center text-xs text-outline">
              Didn't request this?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
