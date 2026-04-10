import { Pencil, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import Button from "../../components/ui/Button";
import SectionHeading from "../../components/ui/SectionHeading";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useAdminJobs, useCloseJob, useExportApplicants, useReopenJob } from "../../hooks/useAdmin";

export default function ManageJobsPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const deferredQuery = useDeferredValue(query);
  const { data: jobs = [], isLoading, isError, error } = useAdminJobs();
  const { mutateAsync: exportApplicants, isPending: isExporting } = useExportApplicants();
  const { mutateAsync: closeJob, isPending: isClosing } = useCloseJob();
  const { mutateAsync: reopenJob, isPending: isReopening } = useReopenJob();
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
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading job inventory</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Fetching published and draft roles from the backend.
        </p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Inventory unavailable</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load job inventory right now."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        label="Inventory"
        title="Manage the placement board"
        description="Monitor role quality, applicant movement, and deadline pressure across the jobs published by the placement cell."
        action={
          <Link to="/admin/jobs/new">
            <Button>Create new job</Button>
          </Link>
        }
      />

      <section className="page-section grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Open Roles", value: summary.active },
          { label: "Closing Soon", value: summary.closing },
          { label: "Draft Roles", value: summary.draft },
          { label: "Total Applicants", value: summary.applicants },
        ].map((item) => (
          <SurfaceCard key={item.label} className="panel-hover p-6">
            <p className="text-sm text-on-surface-variant">{item.label}</p>
            <p className="mt-3 font-headline text-4xl font-extrabold">{item.value}</p>
          </SurfaceCard>
        ))}
      </section>

      <SurfaceCard className="page-section p-6">
        <label className="interactive-strip flex items-center gap-3 rounded-full bg-surface-container-low px-4 py-3">
          <Search className="h-4 w-4 text-outline" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-outline"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by job title or recruiter company"
            value={query}
          />
        </label>
      </SurfaceCard>

      <SurfaceCard className="page-section overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-surface-container-low">
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-outline">
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Applicants</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  className="interactive-strip border-t border-surface-container-low"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-low font-headline font-bold text-primary">
                        {job.companyInitials}
                      </div>
                      <span className="font-semibold text-on-surface">{job.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-on-surface">{job.title}</td>
                  <td className="px-6 py-5 text-sm text-on-surface-variant">{job.deadline}</td>
                  <td className="px-6 py-5 text-sm text-on-surface">
                    {job.applicants}{" "}
                    <span className="text-on-surface-variant">(+{job.newApplicants})</span>
                  </td>
                  <td className="px-6 py-5">
                    <ApplicationStatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/jobs/${job.id}/edit`}>
                        <Button variant="ghost" title="Edit job">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
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
                      <Button
                        variant="ghost"
                        disabled={isExporting}
                        onClick={async () => {
                          try {
                            const fileName = await exportApplicants(job.id);
                            toast.success(`${fileName} downloaded successfully.`);
                          } catch (mutationError) {
                            const message =
                              mutationError?.response?.data?.error ||
                              "Excel export could not be generated.";
                            toast.error(message);
                          }
                        }}
                      >
                        Export
                      </Button>
                      <Link to={`/admin/jobs/${job.id}/applicants`}>
                        <Button variant="secondary">Review</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
