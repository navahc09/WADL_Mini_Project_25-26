import { Bell, CheckCheck, Loader2, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from "../hooks/useNotifications";

const TYPE_COLORS = {
  application_submitted: "bg-primary-fixed text-on-primary-fixed-variant",
  status_update: "bg-tertiary-fixed text-tertiary",
  interview_scheduled: "bg-amber-100 text-amber-700",
  deadline_reminder: "bg-red-50 text-red-600",
  document_update: "bg-surface-container-high text-on-surface-variant",
  default: "bg-surface-container-low text-on-surface-variant",
};

const TYPE_LABELS = {
  application_submitted: "Application",
  status_update: "Status Update",
  interview_scheduled: "Interview",
  deadline_reminder: "Deadline",
  document_update: "Document",
};

function TypeChip({ type }) {
  const key = (type || "").toLowerCase().replace(/\s+/g, "_");
  const label = TYPE_LABELS[key] || type?.replace(/_/g, " ") || "Update";
  const color = TYPE_COLORS[key] || TYPE_COLORS.default;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${color}`}>
      {label}
    </span>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const bellRef = useRef(null);
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { mutateAsync: markAsRead, isPending: isMarking } = useMarkAsRead();
  const { mutateAsync: markAllRead, isPending: isMarkingAll } = useMarkAllRead();
  const { mutateAsync: deleteNotification, isPending: isDeleting } = useDeleteNotification();

  // Recalculate position when opening
  const updatePos = useCallback(() => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, []);

  function handleOpen() {
    updatePos();
    setOpen((v) => !v);
  }

  // Close on scroll or resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close, { passive: true });
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open]);

  async function handleMarkRead(id) {
    try { await markAsRead(id); }
    catch { toast.error("Could not mark as read."); }
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead();
      toast.success("All notifications marked as read.");
    } catch { toast.error("Could not mark all as read."); }
  }

  async function handleDelete(id) {
    try { await deleteNotification(id); }
    catch { toast.error("Could not remove notification."); }
  }

  const panelWidth = Math.min(320, window.innerWidth - 16);

  return (
    <>
      {/* Bell button */}
      <button
        ref={bellRef}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container-high"
        onClick={handleOpen}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Portal — renders directly in <body> to escape all stacking contexts */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Full-screen backdrop */}
              <div
                className="fixed inset-0"
                style={{ zIndex: 9998 }}
                onClick={() => setOpen(false)}
              />

              {/* Dropdown panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  position: "fixed",
                  top: panelPos.top,
                  right: panelPos.right,
                  width: panelWidth,
                  zIndex: 9999,
                }}
                className="rounded-[1.4rem] bg-surface-container-lowest shadow-[0_24px_64px_rgba(0,74,198,0.18)] ring-1 ring-outline-variant/20"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-headline text-sm font-bold text-on-surface">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        disabled={isMarkingAll}
                        onClick={handleMarkAllRead}
                        className="rounded-lg px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50"
                      >
                        {isMarkingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark all read"}
                      </button>
                    )}
                    <button
                      className="rounded-full p-1 hover:bg-surface-container-low"
                      onClick={() => setOpen(false)}
                    >
                      <X className="h-4 w-4 text-outline" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="max-h-[360px] overflow-y-auto overscroll-contain">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-on-surface-variant">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-low">
                        <Bell className="h-5 w-5 text-outline" />
                      </div>
                      <p className="text-sm font-semibold text-on-surface">All caught up</p>
                      <p className="text-xs text-on-surface-variant">
                        Application updates will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-outline-variant/15 px-2 py-1">
                      {notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className={`group rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-container-low/50 ${
                            n.read ? "opacity-55" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {/* Unread dot */}
                            <div
                              className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
                                n.read ? "bg-outline/40" : "bg-primary"
                              }`}
                            />

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-xs font-semibold text-on-surface">{n.title}</p>
                                <TypeChip type={n.type} />
                              </div>
                              <p className="mt-0.5 text-[11px] leading-[1.4] text-on-surface-variant line-clamp-2">
                                {n.body}
                              </p>
                              <p className="mt-0.5 text-[10px] text-outline">{n.createdAt}</p>
                            </div>

                            {/* Actions — visible on hover */}
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                              {!n.read && (
                                <button
                                  disabled={isMarking}
                                  onClick={() => handleMarkRead(n.id)}
                                  className="rounded-lg p-1 text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                                  title="Mark as read"
                                >
                                  <CheckCheck className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                disabled={isDeleting}
                                onClick={() => handleDelete(n.id)}
                                className="rounded-lg p-1 text-on-surface-variant hover:bg-red-50 hover:text-red-500"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-t border-outline-variant/20 px-4 py-2.5">
                    <button
                      onClick={() => { setOpen(false); navigate("/student/notifications"); }}
                      className="w-full rounded-xl py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-container-low"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
