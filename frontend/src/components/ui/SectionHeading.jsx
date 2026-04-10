import { cn } from "../../lib/utils";

export default function SectionHeading({ label, title, description, className, action }) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl space-y-2">
        {label ? <span className="section-label">{label}</span> : null}
        <div className="space-y-1">
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-on-surface-variant">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
