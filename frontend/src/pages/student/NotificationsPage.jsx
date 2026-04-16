import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkAsRead,
  useNotifications,
} from "../../hooks/useNotifications";

const TYPE_COLORS = {
  application_submitted: "bg-primary-fixed text-on-primary-fixed-variant",
  status_update: "bg-tertiary-fixed text-tertiary",
  interview_scheduled: "bg-amber-100 text-amber-700",
  default: "bg-surface-container-low text-on-surface-variant",
};

function NotificationTypeChip({ type }) {
  const label = {
    application_submitted: "Application",
    status_update: "Status Update",
    interview_scheduled: "Interview",
  }[type] || type;
  const color = TYPE_COLORS[type] || TYPE_COLORS.default;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${color}`}>
      {label}
    </span>
  );
}

function NotificationCard({ notification, isMarking, isDeleting, onMarkRead, onDelete }) {
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-xl p-3 transition-colors ${
        notification.read
          ? "bg-surface-container-low/50 opacity-70"
          : "bg-surface-container-lowest shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
            notification.read ? "bg-outline" : "bg-primary"
          }`}
        />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-on-surface">{notification.title}</p>
            <NotificationTypeChip type={notification.type} />
          </div>
          <p className="text-xs leading-5 text-on-surface-variant">{notification.body}</p>
          <p className="text-[10px] text-outline">{notification.createdAt}</p>
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        {!notification.read && (
          <button
            type="button"
            disabled={isMarking}
            onClick={() => onMarkRead(notification.id)}
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            title="Mark as read"
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => onDelete(notification.id)}
          className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading, isError, error } = useNotifications();
  const { mutateAsync: markAsRead, isPending: isMarking } = useMarkAsRead();
  const { mutateAsync: markAllRead, isPending: isMarkingAll } = useMarkAllRead();
  const { mutateAsync: deleteNotification, isPending: isDeleting } = useDeleteNotification();

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  if (isLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading notifications…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Fetching your activity feed.</p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Notifications unavailable</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "Could not load notifications."}
        </p>
      </SurfaceCard>
    );
  }

  async function handleMarkAsRead(id) {
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
    try {
      await deleteNotification(id);
      toast.success("Notification removed.");
    } catch { toast.error("Could not remove notification."); }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Activity Feed</p>
          <h2 className="font-headline text-lg font-bold">Notifications</h2>
        </div>
        {unread.length > 0 && (
          <Button variant="secondary" size="sm" disabled={isMarkingAll} onClick={handleMarkAllRead}>
            {isMarkingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            Mark all read
          </Button>
        )}
      </div>

      {/* Unread */}
      {unread.length > 0 && (
        <SurfaceCard className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {unread.length}
            </span>
            <h3 className="font-headline text-base font-bold">Unread</h3>
          </div>
          <div className="space-y-2">
            {unread.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                isMarking={isMarking}
                isDeleting={isDeleting}
                onMarkRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* Read */}
      {read.length > 0 && (
        <SurfaceCard className="p-4">
          <h3 className="mb-3 font-headline text-base font-bold text-on-surface-variant">Earlier</h3>
          <div className="space-y-2">
            {read.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                isMarking={isMarking}
                isDeleting={isDeleting}
                onMarkRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SurfaceCard>
      )}

      {notifications.length === 0 && (
        <SurfaceCard className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-surface-container-low p-4">
              <Bell className="h-6 w-6 text-on-surface-variant" />
            </div>
            <h3 className="font-headline text-lg font-bold">All caught up</h3>
            <p className="text-sm text-on-surface-variant">
              No notifications yet. Activity will appear here as you apply to jobs.
            </p>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
