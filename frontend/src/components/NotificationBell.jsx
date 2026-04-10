import { Bell, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container-high"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute right-0 top-14 z-50 w-80 rounded-[1.4rem] bg-surface-container-lowest shadow-[0_24px_64px_rgba(0,74,198,0.14)] panel-border"
            >
              <div className="flex items-center justify-between px-5 py-4">
                <p className="font-headline font-bold text-on-surface">Notifications</p>
                <button
                  className="rounded-full p-1 hover:bg-surface-container-low"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4 text-outline" />
                </button>
              </div>

              <div className="px-5 pb-6 pt-2 text-center">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-surface-container-low">
                  <Bell className="h-6 w-6 text-outline" />
                </div>
                <p className="mt-4 text-sm font-semibold text-on-surface">No notifications yet</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Application updates and placement activity will appear here.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
