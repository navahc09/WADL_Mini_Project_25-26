import { cn, toTitleCase } from "../lib/utils";

const tones = {
  applied: "bg-secondary-container text-on-secondary-fixed-variant",
  shortlisted: "bg-primary-fixed text-on-primary-fixed-variant",
  interview: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  offer: "bg-emerald-100 text-emerald-700",
  offered: "bg-emerald-100 text-emerald-700",
  rejected: "bg-error-container text-on-error-container",
  open: "bg-emerald-100 text-emerald-700",
  draft: "bg-surface-container-high text-on-surface-variant",
  "closing soon": "bg-amber-100 text-amber-700",
  "under review": "bg-surface-container-high text-on-surface-variant",
};

export default function ApplicationStatusBadge({ status }) {
  const key = status.toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide",
        tones[key] || "bg-surface-container-high text-on-surface",
      )}
    >
      {toTitleCase(status)}
    </span>
  );
}
