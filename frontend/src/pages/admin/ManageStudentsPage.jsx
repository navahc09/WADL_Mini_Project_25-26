import { forwardRef } from "react";
import {
  ChevronDown,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import BulkUploadDrawer from "../../components/ui/BulkUploadDrawer";
import { useBulkActions, useStudentDetail } from "../../hooks/useAdmin";
import apiClient from "../../lib/apiClient";

const BRANCH_OPTIONS = [
  "Computer Engineering",
  "Information Technology",
  "Electronics & Telecommunication",
  "Electronics & Computer Engineering",
  "Artificial Intelligence & Data Science",
];

const YEARS = ["2025", "2026", "2027", "2028", "2029"];

// Preprocess that safely converts any empty/NaN/undefined value to undefined
// so z.number().optional() treats it correctly instead of failing with "nan"
const toOptionalNumber = (v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  if (typeof v === "number" && isNaN(v)) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
};

const optionalPercent = z.preprocess(
  toOptionalNumber,
  z.number().min(0, "Must be 0–100").max(100, "Must be 0–100").optional(),
);

const createSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  enrollmentNo: z.string().min(3, "Enrollment no. is required"),
  phone: z.string().optional(),
  branch: z.string().min(1, "Select a branch"),
  graduationYear: z.string().min(4, "Select graduation year"),
  // Use preprocess so that an empty/NaN/undefined value is treated as missing,
  // not as an invalid number — avoids "Expected number, received nan" on blur
  cgpa: z.preprocess(
    toOptionalNumber,
    z.number({ required_error: "CGPA is required" }).min(0, "Must be 0–10").max(10, "Must be 0–10"),
  ),
  gender: z.string().optional(),
  city: z.string().optional(),
  tenthPercent: optionalPercent,
  twelfthPercent: optionalPercent,
});

const createDefaults = {
  fullName: "",
  email: "",
  enrollmentNo: "",
  phone: "",
  branch: "",
  graduationYear: "",
  cgpa: undefined,
  gender: "",
  city: "",
  tenthPercent: undefined,
  twelfthPercent: undefined,
};

const editSchema = createSchema.omit({ enrollmentNo: true });

// ── Compact field ─────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <span className="ml-0.5 block text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
        {label}
      </span>
      {children}
      {error && <p className="ml-0.5 text-[10px] text-error">{error}</p>}
    </div>
  );
}

// forwardRef is REQUIRED so react-hook-form's register() ref callback reaches
// the actual <input> DOM node. Without it, React strips `ref` from the custom
// component props and RHF can't read field values → all values stay undefined.
const Input = forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`field-shell w-full py-2 text-sm ${className}`}
    {...props}
  />
));
Input.displayName = "Input";

const Select = forwardRef(({ children, className = "", ...props }, ref) => (
  <select ref={ref} className={`field-shell w-full py-2 text-sm ${className}`} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

// ── Side Panel ────────────────────────────────────────────────────────────────
function StudentPanel({ open, onClose, editStudent }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(editStudent);
  const schema = isEdit ? editSchema : createSchema;

  // Fetch the FULL profile only when editing (editStudent has the user id)
  const {
    data: studentDetail,
    isLoading: detailLoading,
  } = useStudentDetail(isEdit ? editStudent?.id : null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    // "onTouched": validate after first blur, then live on every change.
    // Avoids showing errors before the user has touched a field.
    mode: "onTouched",
    defaultValues: createDefaults,
  });

  // When panel opens for ADD: reset to blank defaults.
  // When panel opens for EDIT + full profile arrives: pre-fill all fields.
  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      reset(createDefaults);
      return;
    }
    // While the detail query is still loading, wait — don't pre-fill with
    // the partial list-row data (missing phone, city, tenth_percent, etc.).
    if (detailLoading || !studentDetail) return;

    reset({
      fullName:      studentDetail.name || "",
      email:         studentDetail.email || "",
      enrollmentNo:  studentDetail.enrollmentNo || "",
      phone:         studentDetail.phone || "",
      branch:        studentDetail.branch || "",
      graduationYear: studentDetail.graduationYear || "",
      cgpa:          studentDetail.cgpa != null ? String(studentDetail.cgpa) : "",
      gender:        studentDetail.gender || "",
      city:          studentDetail.city || "",
      tenthPercent:  studentDetail.tenthPercent != null ? String(studentDetail.tenthPercent) : "",
      twelfthPercent: studentDetail.twelfthPercent != null ? String(studentDetail.twelfthPercent) : "",
    });
  }, [open, isEdit, studentDetail, detailLoading, reset]);

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post("/admin/students", data).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`${data.student.name} added.`);
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.error || "Could not create student."),
  });

  const editMutation = useMutation({
    mutationFn: (data) =>
      apiClient.put(`/admin/students/${editStudent.id}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Student updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.error || "Could not update student."),
  });

  const onSubmit = handleSubmit((values) => {
    if (isEdit) editMutation.mutate(values);
    else createMutation.mutate(values);
  });

  const isBusy = isSubmitting || createMutation.isPending || editMutation.isPending;

  if (!open) return null;

  // Show a skeleton while the full profile is fetching (edit mode only)
  if (isEdit && detailLoading) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative ml-auto flex h-full w-full max-w-[480px] flex-col bg-surface shadow-2xl">
          <div className="flex items-start justify-between border-b border-outline-variant/20 px-5 py-4">
            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface">Edit Student</h3>
              <p className="mt-0.5 text-xs text-on-surface-variant">Loading student details...</p>
            </div>
            <button type="button" onClick={onClose}
              className="rounded-xl p-1.5 text-on-surface-variant hover:bg-surface-container-low">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-surface-container-low" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — full height, no internal scroll */}
      <div className="relative ml-auto flex h-full w-full max-w-[480px] flex-col bg-surface shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant/20 px-5 py-4">
          <div>
            <h3 className="font-headline text-xl font-bold text-on-surface">
              {isEdit ? "Edit Student" : "Add Student"}
            </h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {isEdit
                ? "Update the base details managed by TnP."
                : "TnP fills base details. Send a setup link after saving."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-on-surface-variant hover:bg-surface-container-low"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — flex-1 so it fills space, overflow hidden (no scroll) */}
        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* ── Identity ── */}
            <div>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Identity
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name *" error={errors.fullName?.message}>
                  <Input {...register("fullName")} placeholder="Student's full name" />
                </Field>

                <Field label="Email *" error={errors.email?.message}>
                  <Input type="email" {...register("email")} placeholder="email@university.edu" />
                </Field>

                {!isEdit && (
                  <Field label="Enrollment No. *" error={errors.enrollmentNo?.message}>
                    <Input
                      {...register("enrollmentNo")}
                      placeholder="e.g. I2K231262"
                      className="uppercase"
                    />
                  </Field>
                )}

                <Field label="Phone" error={errors.phone?.message}>
                  <Input {...register("phone")} placeholder="+91 00000 00000" />
                </Field>

                <Field label="Gender" error={errors.gender?.message}>
                  <Select {...register("gender")}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
                </Field>

                <Field label="City" error={errors.city?.message}>
                  <Input {...register("city")} placeholder="City" />
                </Field>
              </div>
            </div>

            {/* ── Academic ── */}
            <div>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Academic Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <span className="ml-0.5 block text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
                    Branch *
                  </span>
                  <Select {...register("branch")}>
                    <option value="">Select branch</option>
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </Select>
                  {errors.branch && (
                    <p className="ml-0.5 text-[10px] text-error">{errors.branch.message}</p>
                  )}
                </div>

                <Field label="Graduation Year *" error={errors.graduationYear?.message}>
                  <Select {...register("graduationYear")}>
                    <option value="">Select year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="CGPA *" error={errors.cgpa?.message}>
                  {/* Do NOT use valueAsNumber here — the Zod preprocess handles
                      coercion, and valueAsNumber: true causes RHF to store NaN
                      for an empty field which bypasses the z.preprocess undefined check */}
                  <Input type="number" step="0.01" min="0" max="10" {...register("cgpa")} placeholder="e.g. 8.5" />
                </Field>

                <Field label="10th %" error={errors.tenthPercent?.message}>
                  <Input type="number" step="0.01" min="0" max="100" {...register("tenthPercent")} placeholder="e.g. 88.5" />
                </Field>

                <Field label="12th %" error={errors.twelfthPercent?.message}>
                  <Input type="number" step="0.01" min="0" max="100" {...register("twelfthPercent")} placeholder="e.g. 85.0" />
                </Field>
              </div>
            </div>
          </div>

          {/* Footer — always visible */}
          <div className="flex gap-3 border-t border-outline-variant/20 px-5 py-4">
            <Button type="submit" className="flex-1" disabled={isBusy}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isBusy
                ? isEdit ? "Saving…" : "Creating…"
                : isEdit ? "Save Changes" : "Create Student"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bulk Assign Modal ─────────────────────────────────────────────────────────
function BulkAssignModal({ selectedIds, onClose }) {
  const [branch, setBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const { assignBranch } = useBulkActions();

  async function handleAssign() {
    if (!branch && !graduationYear) {
      toast.error("Provide at least one field to assign.");
      return;
    }
    try {
      const result = await assignBranch.mutateAsync({ ids: selectedIds, branch, graduationYear });
      toast.success(`${result.updated} student(s) updated.`);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Assignment failed.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-[1.4rem] bg-surface-container-lowest p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-base font-bold">Assign Branch / Batch</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-surface-container-low">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-on-surface-variant">
          Updating <span className="font-semibold text-on-surface">{selectedIds.length}</span> selected student(s). Leave blank to keep existing value.
        </p>

        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">Branch</span>
            <select
              className="field-shell w-full py-2 text-sm"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              <option value="">Keep existing</option>
              {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">Graduation Year</span>
            <select
              className="field-shell w-full py-2 text-sm"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
            >
              <option value="">Keep existing</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button className="flex-1" disabled={assignBranch.isPending} onClick={handleAssign}>
            {assignBranch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {assignBranch.isPending ? "Updating…" : "Apply"}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ManageStudentsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  // Bulk state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDrawerOpen,  setBulkDrawerOpen]  = useState(false);
  const [bulkAssignOpen,  setBulkAssignOpen]  = useState(false);
  const [bulkActionMenu,  setBulkActionMenu]  = useState(false);

  const { activate, deactivate } = useBulkActions();

  function handleSearch(value) {
    setSearch(value);
    clearTimeout(window.__searchTimeout);
    window.__searchTimeout = setTimeout(() => setDebouncedSearch(value), 350);
  }

  function openAdd() { setEditStudent(null); setPanelOpen(true); }
  function openEdit(student) { setEditStudent(student); setPanelOpen(true); }
  function closePanel() { setPanelOpen(false); setEditStudent(null); }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-students", debouncedSearch],
    queryFn: () =>
      apiClient.get("/admin/students", { params: { search: debouncedSearch } }).then((r) => r.data),
  });

  const students = data?.students || [];

  // ── Selection helpers ────────────────────────────────────────────────────────
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  }

  const allSelected   = students.length > 0 && selectedIds.size === students.length;
  const someSelected  = selectedIds.size > 0;
  const selectedArray = [...selectedIds];

  async function handleBulkActivate() {
    try {
      await activate.mutateAsync(selectedArray);
      toast.success(`${selectedArray.length} student(s) activated.`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed.");
    }
  }

  async function handleBulkDeactivate() {
    try {
      await deactivate.mutateAsync(selectedArray);
      toast.success(`${selectedArray.length} student(s) deactivated.`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed.");
    }
  }

  async function handleSendLink(studentId, type) {
    setSendingId(`${studentId}-${type}`);
    try {
      const endpoint =
        type === "setup"
          ? `/admin/students/${studentId}/send-setup-link`
          : `/admin/students/${studentId}/send-reset-link`;
      const { data: result } = await apiClient.post(endpoint);
      toast.success(result.message);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not send email.");
    } finally {
      setSendingId(null);
    }
  }

  const isBulkBusy = activate.isPending || deactivate.isPending;

  return (
    <>
      <StudentPanel open={panelOpen} onClose={closePanel} editStudent={editStudent} />
      <BulkUploadDrawer open={bulkDrawerOpen} onClose={() => setBulkDrawerOpen(false)} />
      {bulkAssignOpen && (
        <BulkAssignModal
          selectedIds={selectedArray}
          onClose={() => setBulkAssignOpen(false)}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Student Management</p>
            <h2 className="font-headline text-lg font-bold">Students</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setBulkDrawerOpen(true)}
              id="bulk-upload-btn"
            >
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Button>
            <Button size="sm" onClick={openAdd} id="add-student-btn">
              <Plus className="h-4 w-4" />
              Add Student
            </Button>
          </div>
        </div>

        {/* ── Bulk Action Toolbar ───────────────────────────────────────────── */}
        {someSelected && (
          <div className="flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/20 px-4 py-2.5">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-primary flex-1">
              {selectedIds.size} student{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={isBulkBusy}
              onClick={handleBulkActivate}
            >
              {activate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Activate
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isBulkBusy}
              onClick={handleBulkDeactivate}
            >
              {deactivate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isBulkBusy}
              onClick={() => setBulkAssignOpen(true)}
            >
              Assign Branch
            </Button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <SurfaceCard className="p-4 space-y-4">
          {/* Search */}
          <div className="field-shell flex items-center gap-3 max-w-sm">
            <Search className="h-4 w-4 shrink-0 text-outline" />
            <input
              className="w-full bg-transparent outline-none text-sm"
              placeholder="Search by name, enrollment no., or email…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => { setSearch(""); setDebouncedSearch(""); }}>
                <X className="h-4 w-4 text-outline hover:text-on-surface" />
              </button>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center gap-3 py-8 text-on-surface-variant">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading students…</span>
            </div>
          ) : isError ? (
            <p className="py-8 text-sm text-error">Failed to load students. Refresh the page.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    {/* Checkbox header */}
                    <th className="pb-3 pr-3 w-8">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    {["Student", "Enrollment No.", "Branch", "Year", "CGPA", "Status", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {students.map((s) => {
                    const isChecked      = selectedIds.has(s.id);
                    const isSetupSending = sendingId === `${s.id}-setup`;
                    const isResetSending = sendingId === `${s.id}-reset`;
                    return (
                      <tr key={s.id} className={`group transition-colors hover:bg-surface-container-low/40 ${isChecked ? "bg-primary/5" : ""}`}>
                        {/* Checkbox */}
                        <td className="py-3 pr-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(s.id)}
                            className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                          />
                        </td>

                        {/* Student name + email */}
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <UserRound className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-on-surface">{s.name}</p>
                              <p className="truncate text-[11px] text-on-surface-variant">{s.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 pr-4">
                          <span className="rounded-lg bg-surface-container-low px-2 py-1 font-mono text-xs text-on-surface">
                            {s.enrollment_no}
                          </span>
                        </td>

                        <td className="py-3 pr-4 text-xs text-on-surface-variant max-w-[140px]">
                          <span className="truncate block">{s.branch}</span>
                        </td>

                        <td className="py-3 pr-4 text-sm text-on-surface-variant">
                          {s.graduation_year}
                        </td>

                        <td className="py-3 pr-4">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            s.cgpa >= 8 ? "bg-green-100 text-green-700"
                            : s.cgpa >= 6.5 ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                          }`}>
                            {s.cgpa}
                          </span>
                        </td>

                        {/* Active status */}
                        <td className="py-3 pr-4">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            s.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            {s.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            {/* Edit */}
                            <button
                              type="button"
                              title="Edit student details"
                              onClick={() => openEdit(s)}
                              className="flex items-center gap-1 rounded-xl border border-outline-variant/40 px-2.5 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>

                            {/* Setup link */}
                            <button
                              type="button"
                              title="Send account setup link"
                              disabled={!!sendingId}
                              onClick={() => handleSendLink(s.id, "setup")}
                              className="flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                            >
                              {isSetupSending
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Send className="h-3 w-3" />}
                              Setup
                            </button>

                            {/* Reset link */}
                            <button
                              type="button"
                              title="Send password reset link"
                              disabled={!!sendingId}
                              onClick={() => handleSendLink(s.id, "reset")}
                              className="flex items-center gap-1 rounded-xl bg-surface-container-low px-2.5 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-50"
                            >
                              {isResetSending
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <RefreshCw className="h-3 w-3" />}
                              Reset
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {students.length === 0 && (
                <div className="py-14 text-center">
                  <Mail className="mx-auto h-8 w-8 text-outline mb-3" />
                  <p className="text-sm font-medium text-on-surface-variant">
                    {debouncedSearch ? "No students match your search." : "No students yet."}
                  </p>
                  {!debouncedSearch && (
                    <p className="mt-1 text-xs text-outline">
                      Click "Add Student" or "Bulk Upload" to get started.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {data?.total > 0 && (
            <p className="text-xs text-outline">
              Showing {students.length} of {data.total} students
              {someSelected && ` · ${selectedIds.size} selected`}
            </p>
          )}
        </SurfaceCard>
      </div>
    </>
  );
}
