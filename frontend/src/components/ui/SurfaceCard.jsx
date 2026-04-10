import { cn } from "../../lib/utils";

export default function SurfaceCard({ className, children }) {
  return <div className={cn("surface-card panel-border", className)}>{children}</div>;
}
