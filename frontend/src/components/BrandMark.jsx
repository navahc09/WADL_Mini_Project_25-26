import { Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

export default function BrandMark({ compact = false, inverted = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl",
          inverted ? "bg-white/15 text-white" : "bg-primary text-white",
        )}
      >
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <p
          className={cn(
            "font-headline text-xl font-extrabold tracking-tight",
            inverted ? "text-white" : "text-primary",
          )}
        >
          TNP Connect
        </p>
        {!compact ? (
          <p className={cn("text-xs uppercase tracking-[0.22em]", inverted ? "text-white/70" : "text-outline")}>
            Career-defining Gallery
          </p>
        ) : null}
      </div>
    </div>
  );
}
