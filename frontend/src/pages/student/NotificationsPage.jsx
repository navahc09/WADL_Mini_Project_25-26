import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import SectionHeading from "../../components/ui/SectionHeading";
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
    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${color}`}>
      {label}
    </span>
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
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading notifications</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Fetching your activity feed from the backend.
        </p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Notifications unavailable</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "Could not load notifications."}
        </p>
      </SurfaceCard>
    );
  }

  async function handleMarkAsRead(id) {
    try {
      await markAsRead(id);
    } catch {
      toast.error("Could not mark notification as read.");
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Could not mark all as read.");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteNotification(id);
      toast.success("Notification removed.");
    } catch {
      toast.error("Could not remove notification.");
    }
  }

  function NotificationCard({ notification }) {
    return (
      <div
        className={`flex flex-col gap-4 rounded-2xl p-4 transition-colors sm:flex-row sm:items-start sm:justify-between ${
          notification.read
            ? "bg-surface-container-low/50 opacity-70"
            : "bg-surface-container-lowest shadow-sm"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
              notification.read ? "bg-outline" : "bg-primary"
            }`}
          />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-on-surface">{notification.title}</p>
              <NotificationTypeChip type={notification.type} />
            </div>
            <p className="text-sm leading-7 text-on-surface-variant">{notification.body}</p>
            <p className="text-xs text-outline">{notification.createdAt}</p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {!notification.read && (
            <button
              type="button"
              disabled={isMarking}
              onClick={() => handleMarkAsRead(notification.id)}
              className="rounded-lg p-2 text-xs text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              title="Mark as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => handleDelete(notification.id)}
            className="rounded-lg p-2 text-xs text-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        label="Activity Feed"
        title="Notifications"
        description="Stay on top of application updates, interview schedules, and placement cell announcements."
        action={
          unread.length > 0 ? (
            <Button
              variant="secondary"
              disabled={isMarkingAll}
              onClick={handleMarkAllRead}
            >
              {isMarkingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark all read
            </Button>
          ) : null
        }
      />

      {/* Unread */}
      {unread.length > 0 && (
        <SurfaceCard className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {unread.length}
            </span>
            <h3 className="font-headline text-lg font-bold">Unread</h3>
          </div>
          <div className="space-y-3">
            {unread.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* Read */}
      {read.length > 0 && (
        <SurfaceCard className="p-6">
          <h3 className="mb-4 font-headline text-lg font-bold text-on-surface-variant">Earlier</h3>
          <div className="space-y-3">
            {read.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        </SurfaceCard>
      )}

      {notifications.length === 0 && (
        <SurfaceCard className="p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-surface-container-low p-6">
              <Bell className="h-8 w-8 text-on-surface-variant" />
            </div>
            <h3 className="font-headline text-2xl font-bold">All caught up</h3>
            <p className="text-sm text-on-surface-variant">
              No notifications yet. Activity will appear here as you apply to jobs and progress
              through the interview pipeline.
            </p>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
