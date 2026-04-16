import { ChevronRight, HelpCircle, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils";
import BrandMark from "./BrandMark";

const navStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const navItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function ShellSidebar({
  navigation,
  cta,
  footerLabel = "Need help?",
  footerDescription = "Support and system status",
  onLogout,
}) {
  return (
    <aside className="hidden h-full w-60 min-w-0 shrink-0 flex-col lg:flex">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="rounded-[1.4rem] bg-surface-container-lowest px-5 py-4 ambient-shadow"
      >
        <BrandMark />
      </motion.div>

      {/* Nav */}
      <motion.nav
        variants={navStagger}
        initial="hidden"
        animate="show"
        className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.key ?? item.to} variants={navItem}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-surface-container-lowest text-primary ambient-shadow"
                      : "text-on-surface-variant hover:bg-surface-container-high",
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </motion.nav>

      {/* CTA */}
      {cta ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 }}
          className="mt-3"
        >
          {cta}
        </motion.div>
      ) : null}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
        className="mt-3 rounded-[1.3rem] bg-surface-container-lowest p-4 text-sm text-on-surface-variant panel-border"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary-fixed p-2 text-primary">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold text-on-surface">{footerLabel}</p>
            <p className="text-xs leading-5">{footerDescription}</p>
          </div>
        </div>
        <button
          className="interactive-strip mt-3 flex w-full items-center justify-between rounded-xl bg-surface-container-low px-3 py-2.5 text-left text-xs font-semibold text-on-surface"
          onClick={onLogout}
        >
          <span className="inline-flex items-center gap-2">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </aside>
  );
}
