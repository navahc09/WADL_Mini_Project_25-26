import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, ArrowLeft, Building2, CalendarClock, CheckCircle2,
  Clock, ExternalLink, Mail, MessageSquare, Phone, Plus, Search,
  Users, X, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import {
  useCompanies, useCompany, useUpdateCompany,
  useAddTimelineEvent, useAddContactLog, useCreateCompany,
} from "../../hooks/useCompany";

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started", color: "bg-surface-container-low text-on-surface-variant" },
  { value: "in_progress", label: "In Progress", color: "bg-amber-100 text-amber-700" },
  { value: "jd_received", label: "JD Received", color: "bg-blue-100 text-blue-700" },
  { value: "approved", label: "Approved", color: "bg-indigo-100 text-indigo-700" },
  { value: "drive_scheduled", label: "Drive Scheduled", color: "bg-purple-100 text-purple-700" },
  { value: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  { value: "dropped", label: "Dropped", color: "bg-red-100 text-red-600" },
];

const EVENT_TYPES = [
  { value: "outreach_initiated", label: "Outreach Initiated" },
  { value: "jd_received", label: "JD Received" },
  { value: "approval_pending", label: "Approval Pending" },
  { value: "drive_scheduled", label: "Drive Scheduled" },
  { value: "drive_completed", label: "Drive Completed" },
  { value: "result_published", label: "Result Published" },
  { value: "follow_up", label: "Follow-up" },
  { value: "contract_signed", label: "Contract Signed" },
  { value: "dropped", label: "Dropped" },
  { value: "note", label: "Internal Note" },
];

const CONTACT_MODES = [
  { value: "email", label: "Email", icon: Mail },
  { value: "call", label: "Phone Call", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "visit", label: "Visit", icon: Building2 },
];

const SLA_COLORS = {
  ok: "text-emerald-600 bg-emerald-50",
  due_soon: "text-amber-600 bg-amber-50",
  overdue: "text-red-600 bg-red-50",
};

function StatusBadge({ status }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${opt.color}`}>
      {opt.label}
    </span>
  );
}

function SlaBadge({ slaStatus, lastContactedAt }) {
  const labels = { ok: "On Track", due_soon: "Due Soon", overdue: "Overdue" };
  const colors = SLA_COLORS[slaStatus] || SLA_COLORS.ok;
  const since = lastContactedAt
    ? `Last contact: ${new Date(lastContactedAt).toLocaleDateString()}`
    : "Never contacted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors}`} title={since}>
      {labels[slaStatus] || "On Track"}
    </span>
  );
}

function AddContactModal({ companyId, onClose }) {
  const { mutateAsync, isPending } = useAddContactLog(companyId);
  const [form, setForm] = useState({ mode: "email", subject: "", notes: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await mutateAsync(form);
      toast.success("Contact logged.");
      onClose();
    } catch { toast.error("Failed to log contact."); }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-[1.4rem] bg-surface-container-lowest p-6 shadow-2xl"
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-bold">Log Contact</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-surface-container-low"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-on-surface-variant">Contact Mode</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {CONTACT_MODES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value} type="button"
                  onClick={() => setForm((f) => ({ ...f, mode: value }))}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    form.mode === value ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-on-surface-variant">Subject</label>
            <input className="field-shell mt-1 w-full" placeholder="e.g. JD follow-up call"
              value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-on-surface-variant">Notes</label>
            <textarea className="field-shell mt-1 min-h-20 w-full resize-none" placeholder="What was discussed?"
              value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={isPending}>{isPending ? "Logging…" : "Log Contact"}</Button>
            <Button size="sm" variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function AddEventModal({ companyId, onClose }) {
  const { mutateAsync, isPending } = useAddTimelineEvent(companyId);
  const [form, setForm] = useState({ eventType: "follow_up", notes: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await mutateAsync(form);
      toast.success("Timeline event added.");
      onClose();
    } catch { toast.error("Failed to add event."); }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-[1.4rem] bg-surface-container-lowest p-6 shadow-2xl"
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-bold">Add Timeline Event</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-surface-container-low"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-on-surface-variant">Event Type</label>
            <select className="field-shell mt-1 w-full" value={form.eventType}
              onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}>
              {EVENT_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-on-surface-variant">Notes</label>
            <textarea className="field-shell mt-1 min-h-20 w-full resize-none" placeholder="Additional context…"
              value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={isPending}>{isPending ? "Adding…" : "Add Event"}</Button>
            <Button size="sm" variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function CompanyDetailPanel({ companyId, onClose }) {
  const { data: company, isLoading } = useCompany(companyId);
  const { mutateAsync: updateCompany } = useUpdateCompany(companyId);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-on-surface-variant">Loading…</p>
      </div>
    );
  }
  if (!company) return null;

  async function handleStatusChange(status) {
    try {
      await updateCompany({ outreachStatus: status });
      toast.success("Status updated.");
      setEditingStatus(false);
    } catch { toast.error("Update failed."); }
  }

  const eventIcon = (type) => {
    if (type.includes("drive")) return "🎯";
    if (type.includes("jd")) return "📄";
    if (type.includes("contract")) return "✍️";
    if (type.includes("result")) return "🏆";
    if (type.includes("drop")) return "❌";
    if (type.includes("outreach")) return "📡";
    return "📌";
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Company Profile</p>
          <h3 className="font-headline text-xl font-bold">{company.name}</h3>
          {company.sector && <p className="text-xs text-on-surface-variant">{company.sector}</p>}
        </div>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-surface-container-low">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Status + SLA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setEditingStatus((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:bg-surface-container-high transition-colors"
            >
              <StatusBadge status={company.outreachStatus} />
              <ChevronDown className="h-3 w-3 text-outline" />
            </button>
            {editingStatus && (
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-2xl bg-surface-container-lowest shadow-xl ring-1 ring-outline-variant/20 py-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-surface-container-low transition-colors"
                  >
                    <span className={`rounded-full px-2 py-0.5 ${opt.color}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <SlaBadge slaStatus={company.slaStatus} lastContactedAt={company.lastContactedAt} />
          {company.openJobCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {company.openJobCount} open {company.openJobCount === 1 ? "role" : "roles"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowEventModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Timeline Event
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowContactModal(true)}>
            <Phone className="h-3.5 w-3.5" /> Log Contact
          </Button>
        </div>

        {/* Hint: status auto-advances when you log events */}
        {company.outreachStatus === "not_started" && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold text-blue-700">👋 Get started</p>
            <p className="mt-0.5 text-xs text-blue-600">
              Add a <span className="font-semibold">Timeline Event</span> (e.g. "Outreach Initiated") and the
              company status will automatically move from <span className="font-semibold">Not Started → In Progress</span>.
            </p>
          </div>
        )}

        {/* Timeline */}
        {company.timeline?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-2">Timeline</p>
            <div className="space-y-2">
              {company.timeline.map((ev) => (
                <div key={ev.id} className="flex gap-3 rounded-xl bg-surface-container-low p-3">
                  <span className="text-base shrink-0">{eventIcon(ev.event_type)}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface capitalize">
                      {ev.event_type.replace(/_/g, " ")}
                    </p>
                    {ev.notes && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{ev.notes}</p>}
                    <p className="text-[10px] text-outline mt-0.5">
                      {new Date(ev.occurred_at).toLocaleDateString()} · {ev.created_by_name || "Admin"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact History */}
        {company.contacts?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-2">Contact History</p>
            <div className="space-y-2">
              {company.contacts.map((contact) => {
                const ModeIcon = CONTACT_MODES.find((m) => m.value === contact.mode)?.icon || Mail;
                return (
                  <div key={contact.id} className="flex gap-3 rounded-xl bg-surface-container-low p-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest text-primary">
                      <ModeIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      {contact.subject && <p className="text-xs font-semibold text-on-surface">{contact.subject}</p>}
                      {contact.notes && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{contact.notes}</p>}
                      <p className="text-[10px] text-outline mt-0.5">
                        {new Date(contact.contacted_at).toLocaleDateString()} · {contact.contacted_by_name || "Admin"} · {contact.mode}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Jobs */}
        {company.jobs?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-2">Roles</p>
            <div className="space-y-1.5">
              {company.jobs.map((job) => (
                <Link key={job.id} to={`/admin/jobs/${job.id}/applicants`}
                  className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2.5 hover:bg-surface-container-high transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{job.title}</p>
                    <p className="text-xs text-on-surface-variant capitalize">{job.status}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{job.applicant_count} applicants</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showContactModal && <AddContactModal companyId={companyId} onClose={() => setShowContactModal(false)} />}
        {showEventModal && <AddEventModal companyId={companyId} onClose={() => setShowEventModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

function AddCompanyModal({ onClose }) {
  const { mutateAsync, isPending } = useCreateCompany();
  const [form, setForm] = useState({ name: "", sector: "", website: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await mutateAsync(form);
      toast.success("Company added.");
      onClose();
    } catch { toast.error("Could not create company."); }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-[1.4rem] bg-surface-container-lowest p-6 shadow-2xl"
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-bold">Add Company</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-surface-container-low"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-on-surface-variant">Company Name *</label>
            <input className="field-shell mt-1 w-full" placeholder="e.g. Infosys" required
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-on-surface-variant">Sector</label>
            <input className="field-shell mt-1 w-full" placeholder="e.g. IT Services"
              value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-on-surface-variant">Website</label>
            <input className="field-shell mt-1 w-full" placeholder="https://..."
              value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={isPending}>{isPending ? "Adding…" : "Add Company"}</Button>
            <Button size="sm" variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function CompanyConsolePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: companies = [], isLoading } = useCompanies({ search, status: statusFilter });

  const slaGroups = useMemo(() => ({
    overdue: companies.filter((c) => c.slaStatus === "overdue").length,
    due_soon: companies.filter((c) => c.slaStatus === "due_soon").length,
  }), [companies]);

  return (
    <div className="flex h-full gap-4">
      {/* Left — list */}
      <div className="flex min-w-0 flex-1 flex-col space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Operations</p>
            <h2 className="font-headline text-lg font-bold">Company Console</h2>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Company
          </Button>
        </div>

        {/* SLA summary */}
        {(slaGroups.overdue > 0 || slaGroups.due_soon > 0) && (
          <div className="flex gap-2">
            {slaGroups.overdue > 0 && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm font-semibold text-red-700">
                  {slaGroups.overdue} {slaGroups.overdue === 1 ? "company" : "companies"} overdue
                </p>
              </div>
            )}
            {slaGroups.due_soon > 0 && (
              <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5">
                <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-sm font-semibold text-amber-700">
                  {slaGroups.due_soon} follow-up due soon
                </p>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <SurfaceCard className="p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-2">
              <Search className="h-3.5 w-3.5 text-outline" />
              <input className="bg-transparent text-sm outline-none placeholder:text-outline md:w-52"
                placeholder="Search company…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              {[{ value: "", label: "All" }, ...STATUS_OPTIONS.slice(0, 5)].map((opt) => (
                <button key={opt.value}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === opt.value ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"
                  }`}
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </SurfaceCard>

        {/* Company list */}
        {isLoading ? (
          <SurfaceCard className="p-5">
            <p className="text-sm text-on-surface-variant">Loading companies…</p>
          </SurfaceCard>
        ) : companies.length === 0 ? (
          <SurfaceCard className="p-6 text-center">
            <Building2 className="mx-auto h-8 w-8 text-outline" />
            <p className="mt-2 text-sm font-semibold text-on-surface">No companies found</p>
            <p className="mt-1 text-xs text-on-surface-variant">Add a company to start tracking outreach.</p>
          </SurfaceCard>
        ) : (
          <div className="space-y-2 overflow-y-auto">
            {companies.map((company) => (
              <SurfaceCard
                key={company.id}
                className={`panel-hover cursor-pointer p-4 transition-all ${selectedId === company.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedId(company.id === selectedId ? null : company.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-on-surface">{company.name}</p>
                      <StatusBadge status={company.outreachStatus} />
                      <SlaBadge slaStatus={company.slaStatus} lastContactedAt={company.lastContactedAt} />
                    </div>
                    {company.sector && (
                      <p className="text-xs text-on-surface-variant mt-0.5">{company.sector}</p>
                    )}
                    {company.assignedCoordinator && (
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Coordinator: <span className="font-semibold text-on-surface">{company.assignedCoordinator}</span>
                      </p>
                    )}
                    {company.nextFollowupAt && (
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Follow-up: {new Date(company.nextFollowupAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-headline text-xl font-extrabold text-on-surface">{company.jobCount}</p>
                    <p className="text-[10px] text-on-surface-variant">roles</p>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>

      {/* Right — detail panel */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-96 shrink-0 overflow-hidden rounded-[1.4rem] bg-surface-container-lowest shadow-[0_8px_40px_rgba(74,144,198,0.12)] ring-1 ring-outline-variant/20"
          >
            <CompanyDetailPanel companyId={selectedId} onClose={() => setSelectedId(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && <AddCompanyModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
