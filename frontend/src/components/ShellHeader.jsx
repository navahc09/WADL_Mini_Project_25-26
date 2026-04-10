import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

function initialsFor(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ShellHeader({ user, searchPlaceholder, searchPath, actions }) {
  const navigate = useNavigate();

  function handleSearch(event) {
    if (event.key === "Enter" && event.target.value.trim()) {
      const destination = searchPath || (user?.role === "admin" ? "/admin/jobs" : "/student/jobs");
      navigate(`${destination}?q=${encodeURIComponent(event.target.value.trim())}`);
      event.target.value = "";
    }
  }

  return (
    <header className="glass-panel flex-none rounded-[1.4rem] border border-white/60 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {searchPlaceholder ? (
          <label className="flex flex-1 items-center gap-3 rounded-full bg-surface-container-low px-4 py-2.5 text-sm text-on-surface-variant">
            <Search className="h-4 w-4 shrink-0 text-outline" />
            <input
              className="w-full bg-transparent outline-none placeholder:text-outline"
              placeholder={searchPlaceholder}
              type="text"
              onKeyDown={handleSearch}
            />
          </label>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell count={3} />
          {actions}
          <div className="flex cursor-default items-center gap-2.5 rounded-full bg-surface-container-low px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {initialsFor(user?.name)}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-tight text-on-surface">{user?.name}</p>
              <p className="text-xs capitalize text-on-surface-variant">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
