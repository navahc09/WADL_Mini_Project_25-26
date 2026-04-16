import { Plus, Trash2, X, Loader2, Award, Briefcase, Tag, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import SurfaceCard from "../../components/ui/SurfaceCard";
import {
  useCertifications,
  useStudentProfile,
  useUpdateSkills,
  useWorkExperiences,
} from "../../hooks/useStudent";

// ─── Read-only field ──────────────────────────────────────────────────────────
function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-1 text-sm">
      <span className="ml-1 flex items-center gap-1 text-xs text-on-surface-variant">
        {label}
        <Lock className="h-3 w-3 text-outline" />
      </span>
      <div className="field-shell flex items-center bg-surface-container-low/60 text-on-surface-variant cursor-not-allowed select-none">
        {value || <span className="text-outline italic">Not set</span>}
      </div>
    </div>
  );
}

// ─── Skill Tag Input ──────────────────────────────────────────────────────────
function SkillTagInput({ skills, onSave, isSaving }) {
  const [tags, setTags] = useState(skills || []);
  const [input, setValue] = useState("");

  useEffect(() => { setTags(skills || []); }, [skills]);

  function addTag(e) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const tag = input.trim().replace(/,$/, "");
      if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
      setValue("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-surface-container-low bg-surface-container-low/50 p-2.5 min-h-10">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {tag}
            <button type="button" onClick={() => setTags((p) => p.filter((t) => t !== tag))} className="rounded-full hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          className="min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-outline"
          placeholder="Type skill + Enter…"
          value={input}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={addTag}
        />
      </div>
      <Button type="button" size="sm" variant="secondary" disabled={isSaving} onClick={() => onSave(tags)}>
        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
        {isSaving ? "Saving…" : "Save Skills"}
      </Button>
    </div>
  );
}

// ─── Work Experience Form ─────────────────────────────────────────────────────
function WorkExpForm({ initial, onSave, onCancel, isSaving }) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      company: initial?.company || "",
      role: initial?.role || "",
      startDate: initial?.start_date?.slice(0, 10) || "",
      endDate: initial?.end_date?.slice(0, 10) || "",
      isCurrent: initial?.is_current || false,
      description: initial?.description || "",
    },
  });
  const isCurrent = watch("isCurrent");

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-3 rounded-xl border border-primary/20 bg-surface-container-low p-4">
      <div className="grid gap-3 md:grid-cols-2">
        {[["Company", "company"], ["Role / Title", "role"]].map(([label, key]) => (
          <label key={key} className="space-y-1 text-sm">
            <span className="ml-1 block text-xs text-on-surface-variant">{label}</span>
            <input className="field-shell w-full" required {...register(key)} />
          </label>
        ))}
        <label className="space-y-1 text-sm">
          <span className="ml-1 block text-xs text-on-surface-variant">Start Date</span>
          <input type="date" className="field-shell w-full" required {...register("startDate")} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="ml-1 block text-xs text-on-surface-variant">End Date</span>
          <input type="date" className="field-shell w-full" disabled={isCurrent} {...register("endDate")} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-on-surface-variant">
        <input type="checkbox" className="rounded" {...register("isCurrent")} />
        Currently working here
      </label>
      <label className="space-y-1 text-sm">
        <span className="ml-1 block text-xs text-on-surface-variant">Description (optional)</span>
        <textarea className="field-shell min-h-16 w-full resize-none" {...register("description")} />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {isSaving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Certification Form ───────────────────────────────────────────────────────
function CertForm({ initial, onSave, onCancel, isSaving }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: initial?.name || "",
      issuer: initial?.issuer || "",
      issuedDate: initial?.issued_date?.slice(0, 10) || "",
      certUrl: initial?.cert_url || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-3 rounded-xl border border-primary/20 bg-surface-container-low p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="ml-1 block text-xs text-on-surface-variant">Certificate Name</span>
          <input className="field-shell w-full" required {...register("name")} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="ml-1 block text-xs text-on-surface-variant">Issuing Organization</span>
          <input className="field-shell w-full" {...register("issuer")} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="ml-1 block text-xs text-on-surface-variant">Issue Date</span>
          <input type="date" className="field-shell w-full" {...register("issuedDate")} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="ml-1 block text-xs text-on-surface-variant">Certificate URL</span>
          <input type="url" className="field-shell w-full" placeholder="https://…" {...register("certUrl")} />
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {isSaving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const formRef = useRef(null);
  const { data: profile, isLoading, isError, error, saveProfile, isSaving } = useStudentProfile();
  const { mutateAsync: saveSkills, isPending: isSavingSkills } = useUpdateSkills();
  const workExp = useWorkExperiences();
  const certs = useCertifications();

  const [addingWorkExp, setAddingWorkExp] = useState(false);
  const [editingWorkExpId, setEditingWorkExpId] = useState(null);
  const [addingCert, setAddingCert] = useState(false);
  const [editingCertId, setEditingCertId] = useState(null);

  const { register, reset, handleSubmit } = useForm({
    defaultValues: { headline: "", about: "", preferredLocations: "", preferredDomains: "", expectedSalary: "" },
  });

  function joinList(values = []) { return values.join(", "); }
  function splitList(v) { return String(v || "").split(",").map((s) => s.trim()).filter(Boolean); }

  useEffect(() => {
    if (!profile) return;
    reset({
      headline: profile.headline || "",
      about: profile.about || "",
      preferredLocations: joinList(profile.preferences?.locations),
      preferredDomains: joinList(profile.preferences?.domains),
      expectedSalary: profile.preferences?.expectedSalary || "",
    });
  }, [profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveProfile({
        headline: values.headline,
        about: values.about,
        preferences: {
          locations: splitList(values.preferredLocations),
          domains: splitList(values.preferredDomains),
          expectedSalary: values.expectedSalary,
        },
      });
      toast.success("Profile updated.");
    } catch (mutationError) {
      toast.error(mutationError?.response?.data?.error || "Profile update failed.");
    }
  });

  const handleSaveSkills = async (skills) => {
    try { await saveSkills(skills); toast.success("Skills updated."); }
    catch { toast.error("Could not save skills."); }
  };

  const handleAddWorkExp = async (values) => {
    try { await workExp.add(values); toast.success("Work experience added."); setAddingWorkExp(false); }
    catch { toast.error("Could not add work experience."); }
  };
  const handleUpdateWorkExp = async (values) => {
    try { await workExp.update({ id: editingWorkExpId, ...values }); toast.success("Updated."); setEditingWorkExpId(null); }
    catch { toast.error("Could not update work experience."); }
  };
  const handleDeleteWorkExp = async (id) => {
    try { await workExp.remove(id); toast.success("Removed."); }
    catch { toast.error("Could not remove work experience."); }
  };

  const handleAddCert = async (values) => {
    try { await certs.add(values); toast.success("Certification added."); setAddingCert(false); }
    catch { toast.error("Could not add certification."); }
  };
  const handleUpdateCert = async (values) => {
    try { await certs.update({ id: editingCertId, ...values }); toast.success("Updated."); setEditingCertId(null); }
    catch { toast.error("Could not update certification."); }
  };
  const handleDeleteCert = async (id) => {
    try { await certs.remove(id); toast.success("Removed."); }
    catch { toast.error("Could not remove certification."); }
  };

  if (isLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading profile…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Pulling academic and identity data.</p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Profile unavailable</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{error?.response?.data?.error || "Could not load profile."}</p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Profile Studio</p>
          <h2 className="font-headline text-lg font-bold">{profile?.name || "Student profile"}</h2>
        </div>
        <Button size="sm" type="button" onClick={() => formRef.current?.requestSubmit()} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Left column */}
        <div className="space-y-3">
          {/* Identity — read-only */}
          <SurfaceCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-on-surface">Identity</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-[10px] font-semibold text-on-surface-variant">
                <Lock className="h-2.5 w-2.5" /> Managed by TnP
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField label="Full Name" value={profile?.name} />
              <ReadOnlyField label="Email" value={profile?.email} />
              <ReadOnlyField label="Phone" value={profile?.phone} />
              <ReadOnlyField label="City" value={profile?.city} />
            </div>
          </SurfaceCard>

          {/* Academic — read-only */}
          <SurfaceCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-on-surface">Academic Details</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-[10px] font-semibold text-on-surface-variant">
                <Lock className="h-2.5 w-2.5" /> Managed by TnP
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField label="Enrollment Number" value={profile?.rollNumber} />
              <ReadOnlyField label="Branch" value={profile?.branch} />
              <ReadOnlyField label="Graduation Year" value={profile?.graduationYear?.toString()} />
              <ReadOnlyField label="CGPA" value={profile?.cgpa?.toString()} />
            </div>
            <p className="mt-3 text-xs text-outline">Contact TnP to update any of the above details.</p>
          </SurfaceCard>

          {/* Career Narrative — editable */}
          <SurfaceCard className="p-4">
            <h3 className="mb-3 font-semibold text-on-surface">Career Narrative</h3>
            <form ref={formRef} className="space-y-3" onSubmit={onSubmit}>
              <label className="space-y-1 text-sm">
                <span className="ml-1 block text-xs text-on-surface-variant">Headline</span>
                <input className="field-shell w-full" {...register("headline")} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="ml-1 block text-xs text-on-surface-variant">About</span>
                <textarea className="field-shell min-h-20 w-full resize-none" {...register("about")} />
              </label>
            </form>
          </SurfaceCard>

          {/* Placement Preferences — editable */}
          <SurfaceCard className="p-4">
            <h3 className="mb-3 font-semibold text-on-surface">Placement Preferences</h3>
            <div className="space-y-3">
              {[
                ["Preferred Locations (comma-separated)", "preferredLocations"],
                ["Preferred Domains (comma-separated)", "preferredDomains"],
                ["Expected Salary", "expectedSalary"],
              ].map(([label, key]) => (
                <label key={key} className="space-y-1 text-sm">
                  <span className="ml-1 block text-xs text-on-surface-variant">{label}</span>
                  <input className="field-shell w-full" {...register(key)} />
                </label>
              ))}
            </div>
          </SurfaceCard>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {/* Completeness */}
          <SurfaceCard className="p-4">
            <div className="rounded-xl bg-signature p-4 text-white">
              <p className="text-xs text-white/70">Profile completeness</p>
              <p className="mt-1 font-headline text-3xl font-extrabold">{profile?.metrics?.profileCompleteness ?? 0}%</p>
              <p className="mt-1 text-xs leading-5 text-white/75">
                Add skills, work experience, and certifications to increase visibility.
              </p>
            </div>
          </SurfaceCard>

          {/* Skills */}
          <SurfaceCard className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-on-surface">Key Skills</h3>
            </div>
            <SkillTagInput skills={profile?.skills || []} onSave={handleSaveSkills} isSaving={isSavingSkills} />
          </SurfaceCard>

          {/* Work Experience */}
          <SurfaceCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-on-surface">Work Experience</h3>
              </div>
              {!addingWorkExp && (
                <button type="button" onClick={() => setAddingWorkExp(true)}
                  className="flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              )}
            </div>
            <div className="space-y-3">
              {addingWorkExp && (
                <WorkExpForm onSave={handleAddWorkExp} onCancel={() => setAddingWorkExp(false)} isSaving={workExp.isAdding} />
              )}
              {(profile?.workExperiences || []).map((we) =>
                editingWorkExpId === we.id ? (
                  <WorkExpForm key={we.id} initial={we} onSave={handleUpdateWorkExp} onCancel={() => setEditingWorkExpId(null)} isSaving={workExp.isUpdating} />
                ) : (
                  <div key={we.id} className="rounded-xl bg-surface-container-low p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{we.role} @ {we.company}</p>
                        <p className="mt-0.5 text-xs text-on-surface-variant">
                          {we.start_date?.slice(0, 7)} — {we.is_current ? "Present" : (we.end_date?.slice(0, 7) || "N/A")}
                        </p>
                        {we.description && <p className="mt-1 text-xs leading-5 text-on-surface-variant">{we.description}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => setEditingWorkExpId(we.id)}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary">
                          <Plus className="h-3.5 w-3.5 rotate-45" />
                        </button>
                        <button type="button" onClick={() => handleDeleteWorkExp(we.id)} disabled={workExp.isRemoving}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
              {(profile?.workExperiences || []).length === 0 && !addingWorkExp && (
                <p className="text-xs text-on-surface-variant">No work experience added yet.</p>
              )}
            </div>
          </SurfaceCard>

          {/* Certifications */}
          <SurfaceCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-on-surface">Certifications</h3>
              </div>
              {!addingCert && (
                <button type="button" onClick={() => setAddingCert(true)}
                  className="flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              )}
            </div>
            <div className="space-y-3">
              {addingCert && (
                <CertForm onSave={handleAddCert} onCancel={() => setAddingCert(false)} isSaving={certs.isAdding} />
              )}
              {(profile?.certifications || []).map((cert) =>
                editingCertId === cert.id ? (
                  <CertForm key={cert.id} initial={cert} onSave={handleUpdateCert} onCancel={() => setEditingCertId(null)} isSaving={certs.isUpdating} />
                ) : (
                  <div key={cert.id} className="rounded-xl bg-surface-container-low p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{cert.name}</p>
                        {cert.issuer && <p className="mt-0.5 text-xs text-on-surface-variant">{cert.issuer}</p>}
                        {cert.issued_date && <p className="text-xs text-outline">{cert.issued_date?.slice(0, 10)}</p>}
                        {cert.cert_url && (
                          <a href={cert.cert_url} target="_blank" rel="noreferrer" className="mt-0.5 text-xs text-primary underline">
                            View certificate
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => setEditingCertId(cert.id)}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary">
                          <Plus className="h-3.5 w-3.5 rotate-45" />
                        </button>
                        <button type="button" onClick={() => handleDeleteCert(cert.id)} disabled={certs.isRemoving}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
              {(profile?.certifications || []).length === 0 && !addingCert && (
                <p className="text-xs text-on-surface-variant">No certifications added yet.</p>
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
