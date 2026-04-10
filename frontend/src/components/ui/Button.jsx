import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const variants = {
  primary:
    "signature-gradient text-white shadow-halo hover:-translate-y-[1px] hover:shadow-[0_22px_48px_rgba(37,99,235,0.18)]",
  secondary:
    "bg-surface-container-high text-on-surface hover:-translate-y-[1px] hover:bg-surface-container-highest",
  ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-low",
  tertiary:
    "bg-primary-fixed text-on-primary-fixed-variant hover:-translate-y-[1px] hover:bg-primary-fixed-dim",
};

const sizes = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-4 text-base",
};

const MotionButton = motion.button;

const Button = forwardRef(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <MotionButton
      ref={ref}
      type={type}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 will-change-transform disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export default Button;
