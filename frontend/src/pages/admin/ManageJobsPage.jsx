import { Pencil, Search, Send } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useAdminJobs, useCloseJob, useExportApplicants, usePublishJob, useReopenJob } from "../../hooks/useAdmin";

export default function ManageJobsPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const deferredQuery = useDeferredValue(query);
  const { data: jobs = [], isLoading, isError, error } = useAdminJobs();
  const { mutateAsync: exportApplicants, isPending: isExporting } = useExportApplicants();
  const { mutateAsync: closeJob, isPending: isClosing } = useCloseJob();
  const { mutateAsync: reopenJob, isPending: isReopening } = useReopenJob();
  const { mutateAsync: publishJob, isPending: isPublishing } = usePublishJob();
  const [statusActionId, setStatusActionId] = useState(null);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) =>
      `${job.company} ${job.title}`.toLowerCase().includes(deferredQuery.toLowerCase()),
    );
  }, [deferredQuery, jobs]);

  const summary = useMemo(
    () => ({
      active: jobs.filter((job) => job.status === "Open").length,
      closing: jobs.filter((job) => job.status === "Closing Soon").length,
      draft: jobs.filter((job) => job.status === "Draft").length,
      applicants: jobs.reduce((total, job) => total + job.applicants, 0),
    }),
    [jobs],
  );

  if (isLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading job inventory…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Fetching published and draft roles.</p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Inventory unavailable</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load job inventory right now."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Inventory</p>
          <h2 className="font-headline text-lg font-bold">Manage placement board</h2>
        </div>
        <Link to="/admin/jobs/new">
          <Button size="sm">Create new job</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Open Roles", value: summary.active },
          { label: "Closing Soon", value: summary.closing },
          { label: "Draft Roles", value: summary.draft },
          { label: "Total Applicants", value: summary.applicants },
        ].map((item) => (
          <SurfaceCard key={item.label} className="panel-hover p-4">
            <p className="text-xs text-on-surface-variant">{item.label}</p>
            <p className="mt-1 font-headline text-2xl font-extrabold">{item.value}</p>
          </SurfaceCard>
        ))}
      </div>

      {/* Search */}
      <SurfaceCard className="p-3">
        <label className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-2">
          <Search className="h-3.5 w-3.5 text-outline" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-outline"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by job title or company"
            value={query}
          />
        </label>
      </SurfaceCard>

      {/* Table */}
      <SurfaceCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-surface-container-low">
              <tr className="text-left text-[10px] uppercase tracking-widest text-outline">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Applicants</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const isDraft = job.status === "Draft";
                return (
                <tr key={job.id} className={`border-t border-surface-container-low transition-colors ${
                  isDraft
                    ? "bg-amber-50/60 hover:bg-amber-50"
                    : "hover:bg-surface-container-low/40"
                }`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-container-low font-headline text-xs font-bold text-primary">
                        {job.companyInitials}
                      </div>
                      <span className="text-sm font-semibold text-on-surface">{job.company}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface">
                    {job.title}
                    {isDraft && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{job.deadline || "—"}</td>
                  <td className="px-4 py-3 text-sm text-on-surface">
                    {job.applicants}{" "}
                    <span className="text-on-surface-variant">(+{job.newApplicants})</span>
                  </td>
                  <td className="px-4 py-3">
                    <ApplicationStatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {/* Publish button — only on drafts */}
                      {isDraft && (
                        <Button
                          variant="ghost" size="sm"
                          disabled={isPublishing && statusActionId === job.id}
                          onClick={async () => {
                            setStatusActionId(job.id);
                            try {
                              await publishJob(job.id);
                              toast.success(`“${job.title}” is now LIVE.`);
                            } catch (err) {
                              toast.error(err?.response?.data?.error || "Publish failed.");
                            } finally {
                              setStatusActionId(null);
                            }
                          }}
                        >
                          <Send className="h-3.5 w-3.5" /> Publish
                        </Button>
                      )}
                      <Link to={`/admin/jobs/${job.id}/edit`}>
                        <Button variant="ghost" size="sm" title="Edit job">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </Link>
                      {!isDraft && (
                        <Button
                          variant="ghost" size="sm"
                          disabled={(isClosing || isReopening) && statusActionId === job.id}
                          onClick={async () => {
                            setStatusActionId(job.id);
                            try {
                              if (job.status === "Closed") {
                                await reopenJob(job.id);
                                toast.success(`${job.title} reopened.`);
                              } else {
                                await closeJob(job.id);
                                toast.success(`${job.title} closed.`);
                              }
                            } catch (err) {
                              toast.error(err?.response?.data?.error || "Status change failed.");
                            } finally {
                              setStatusActionId(null);
                            }
                          }}
                        >
                          {job.status === "Closed" ? "Reopen" : "Close"}
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        disabled={isExporting}
                        onClick={async () => {
                          try {
                            const fileName = await exportApplicants(job.id);
                            toast.success(`${fileName} downloaded.`);
                          } catch (mutationError) {
                            toast.error(
                              mutationError?.response?.data?.error || "Export failed.",
                            );
                          }
                        }}
                      >
                        Export
                      </Button>
                      <Link to={`/admin/jobs/${job.id}/applicants`}>
                        <Button variant="secondary" size="sm">Review</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
                );
              })}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-on-surface-variant">
                    No jobs match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
