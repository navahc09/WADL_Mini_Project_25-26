import { Plus, Trash2, X, Loader2, Award, Briefcase, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import SectionHeading from "../../components/ui/SectionHeading";
import SurfaceCard from "../../components/ui/SurfaceCard";
import {
  useCertifications,
  useStudentProfile,
  useUpdateSkills,
  useWorkExperiences,
} from "../../hooks/useStudent";

// ─── Skill Tag Input ─────────────────────────────────────────────────────────
function SkillTagInput({ skills, onSave, isSaving }) {
  const [tags, setTags] = useState(skills || []);
  const [input, setValue] = useState("");

  useEffect(() => {
    setTags(skills || []);
  }, [skills]);

  function addTag(e) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const tag = input.trim().replace(/,$/, "");
      if (tag && !tags.includes(tag)) {
        setTags((prev) => [...prev, tag]);
      }
      setValue("");
    }
  }

  function removeTag(tag) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-surface-container-low bg-surface-container-low/50 p-3 min-h-14">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-outline"
          placeholder="Type skill and press Enter..."
          value={input}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={addTag}
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={isSaving}
        onClick={() => onSave(tags)}
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
        {isSaving ? "Saving..." : "Save Skills"}
      </Button>
    </div>
  );
}

// ─── Work Experience Form ────────────────────────────────────────────────────
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
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 rounded-2xl border border-primary/20 bg-surface-container-low p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="ml-1 block text-on-surface-variant">Company</span>
          <input className="field-shell w-full" required {...register("company")} />
        </label>
        <label className="space-y-2 text-sm">
          <span className="ml-1 block text-on-surface-variant">Role / Title</span>
          <input className="field-shell w-full" required {...register("role")} />
        </label>
        <label className="space-y-2 text-sm">
          <span className="ml-1 block text-on-surface-variant">Start Date</span>
          <input type="date" className="field-shell w-full" required {...register("startDate")} />
        </label>
        <label className="space-y-2 text-sm">
          <span className="ml-1 block text-on-surface-variant">End Date</span>
          <input
            type="date"
            className="field-shell w-full"
            disabled={isCurrent}
            {...register("endDate")}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-on-surface-variant">
        <input type="checkbox" className="rounded" {...register("isCurrent")} />
        Currently working here
      </label>
      <label className="space-y-2 text-sm">
        <span className="ml-1 block text-on-surface-variant">Description (optional)</span>
        <textarea className="field-shell min-h-20 w-full resize-none" {...register("description")} />
      </label>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Certification Form ──────────────────────────────────────────────────────
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
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 rounded-2xl border border-primary/20 bg-surface-container-low p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="ml-1 block text-on-surface-variant">Certificate Name</span>
          <input className="field-shell w-full" required {...register("name")} />
        </label>
        <label className="space-y-2 text-sm">
          <span className="ml-1 block text-on-surface-variant">Issuing Organization</span>
          <input className="field-shell w-full" {...register("issuer")} />
        </label>
        <label className="space-y-2 text-sm">
          <span className="ml-1 block text-on-surface-variant">Issue Date</span>
          <input type="date" className="field-shell w-full" {...register("issuedDate")} />
        </label>
        <label className="space-y-2 text-sm">
          <span className="ml-1 block text-on-surface-variant">Certificate URL</span>
          <input type="url" className="field-shell w-full" placeholder="https://..." {...register("certUrl")} />
        </label>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Main Profile Page ───────────────────────────────────────────────────────
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
    defaultValues: {
      name: "", email: "", phone: "", city: "", branch: "",
      graduationYear: "", cgpa: "", rollNumber: "", headline: "", about: "",
      preferredLocations: "", preferredDomains: "", expectedSalary: "",
    },
  });

  function joinList(values = []) { return values.join(", "); }
  function splitList(v) {
    return String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
  }

  useEffect(() => {
    if (!profile) return;
    reset({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      city: profile.city || "",
      branch: profile.branch || "",
      graduationYear: profile.graduationYear || "",
      cgpa: profile.cgpa || "",
      rollNumber: profile.rollNumber || "",
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
        name: values.name, email: values.email, phone: values.phone,
        city: values.city, branch: values.branch,
        graduationYear: Number(values.graduationYear),
        cgpa: Number(values.cgpa), rollNumber: values.rollNumber,
        headline: values.headline, about: values.about,
        preferences: {
          locations: splitList(values.preferredLocations),
          domains: splitList(values.preferredDomains),
          expectedSalary: values.expectedSalary,
        },
      });
      toast.success(`Profile updated for ${values.name}.`);
    } catch (mutationError) {
      toast.error(mutationError?.response?.data?.error || "Profile update could not be completed.");
    }
  });

  const handleSaveSkills = async (skills) => {
    try {
      await saveSkills(skills);
      toast.success("Skills updated.");
    } catch {
      toast.error("Could not save skills.");
    }
  };

  // Work Exp handlers
  const handleAddWorkExp = async (values) => {
    try {
      await workExp.add(values);
      toast.success("Work experience added.");
      setAddingWorkExp(false);
    } catch { toast.error("Could not add work experience."); }
  };

  const handleUpdateWorkExp = async (values) => {
    try {
      await workExp.update({ id: editingWorkExpId, ...values });
      toast.success("Work experience updated.");
      setEditingWorkExpId(null);
    } catch { toast.error("Could not update work experience."); }
  };

  const handleDeleteWorkExp = async (id) => {
    try {
      await workExp.remove(id);
      toast.success("Removed.");
    } catch { toast.error("Could not remove work experience."); }
  };

  // Cert handlers
  const handleAddCert = async (values) => {
    try {
      await certs.add(values);
      toast.success("Certification added.");
      setAddingCert(false);
    } catch { toast.error("Could not add certification."); }
  };

  const handleUpdateCert = async (values) => {
    try {
      await certs.update({ id: editingCertId, ...values });
      toast.success("Certification updated.");
      setEditingCertId(null);
    } catch { toast.error("Could not update certification."); }
  };

  const handleDeleteCert = async (id) => {
    try {
      await certs.remove(id);
      toast.success("Removed.");
    } catch { toast.error("Could not remove certification."); }
  };

  if (isLoading) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading profile studio</h2>
        <p className="mt-3 text-sm text-on-surface-variant">Pulling academic, identity, and preference data from the backend.</p>
      </SurfaceCard>
    );
  }

  if (isError) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Profile unavailable</h2>
        <p className="mt-3 text-sm text-on-surface-variant">{error?.response?.data?.error || "We could not load the student profile right now."}</p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        label="Profile Studio"
        title={profile?.name || "Student profile"}
        description="Keep your narrative sharp. This view is designed around the academic and hiring signals recruiters actually inspect."
        action={
          <Button size="lg" type="button" onClick={() => formRef.current?.requestSubmit()} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <form ref={formRef} className="space-y-6" onSubmit={onSubmit}>
          {/* Identity */}
          <SurfaceCard className="p-6">
            <h3 className="font-headline text-2xl font-bold">Identity Layer</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[["Full Name", "name"], ["Email", "email"], ["Phone", "phone"], ["City", "city"]].map(([label, key]) => (
                <label key={key} className="space-y-2 text-sm">
                  <span className="ml-1 block text-on-surface-variant">{label}</span>
                  <input className="field-shell w-full" {...register(key)} />
                </label>
              ))}
            </div>
          </SurfaceCard>

          {/* Academic */}
          <SurfaceCard className="p-6">
            <h3 className="font-headline text-2xl font-bold">Academic Signals</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[["Branch", "branch"], ["Graduation Year", "graduationYear"], ["Roll Number", "rollNumber"]].map(([label, key]) => (
                <label key={key} className="space-y-2 text-sm">
                  <span className="ml-1 block text-on-surface-variant">{label}</span>
                  <input className="field-shell w-full" {...register(key)} />
                </label>
              ))}
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">CGPA</span>
                <input className="field-shell w-full" step="0.01" type="number" {...register("cgpa")} />
              </label>
            </div>
          </SurfaceCard>

          {/* Career Narrative */}
          <SurfaceCard className="p-6">
            <h3 className="font-headline text-2xl font-bold">Career Narrative</h3>
            <div className="mt-5 space-y-4">
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">Headline</span>
                <input className="field-shell w-full" {...register("headline")} />
              </label>
              <label className="space-y-2 text-sm">
                <span className="ml-1 block text-on-surface-variant">About</span>
                <textarea className="field-shell min-h-32 w-full resize-none" {...register("about")} />
              </label>
            </div>
          </SurfaceCard>

          {/* Placement Preferences */}
          <SurfaceCard className="p-6">
            <h3 className="font-headline text-2xl font-bold">Placement Preferences</h3>
            <div className="mt-5 grid gap-4">
              {[
                ["Preferred Locations (comma-separated)", "preferredLocations"],
                ["Preferred Domains (comma-separated)", "preferredDomains"],
                ["Expected Salary", "expectedSalary"],
              ].map(([label, key]) => (
                <label key={key} className="space-y-2 text-sm">
                  <span className="ml-1 block text-on-surface-variant">{label}</span>
                  <input className="field-shell w-full" {...register(key)} />
                </label>
              ))}
            </div>
          </SurfaceCard>
        </form>

        <div className="space-y-6">
          {/* Completeness */}
          <SurfaceCard className="p-6">
            <span className="section-label">Readiness</span>
            <div className="mt-5 rounded-[1.4rem] bg-signature p-6 text-white">
              <p className="text-sm text-white/70">Profile completeness</p>
              <p className="mt-2 font-headline text-5xl font-extrabold">{profile?.metrics?.profileCompleteness ?? 0}%</p>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Recruiter-facing details are mostly ready. Fine-tune projects, profile links, and domain preferences to push completion even higher.
              </p>
            </div>
          </SurfaceCard>

          {/* Skills Tag Input */}
          <SurfaceCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="font-headline text-2xl font-bold">Key Skills</h3>
            </div>
            <SkillTagInput
              skills={profile?.skills || []}
              onSave={handleSaveSkills}
              isSaving={isSavingSkills}
            />
          </SurfaceCard>

          {/* Work Experience */}
          <SurfaceCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="font-headline text-2xl font-bold">Work Experience</h3>
              </div>
              {!addingWorkExp && (
                <button
                  type="button"
                  onClick={() => setAddingWorkExp(true)}
                  className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              )}
            </div>

            <div className="space-y-4">
              {addingWorkExp && (
                <WorkExpForm
                  onSave={handleAddWorkExp}
                  onCancel={() => setAddingWorkExp(false)}
                  isSaving={workExp.isAdding}
                />
              )}

              {(profile?.workExperiences || []).map((we) =>
                editingWorkExpId === we.id ? (
                  <WorkExpForm
                    key={we.id}
                    initial={we}
                    onSave={handleUpdateWorkExp}
                    onCancel={() => setEditingWorkExpId(null)}
                    isSaving={workExp.isUpdating}
                  />
                ) : (
                  <div key={we.id} className="rounded-2xl bg-surface-container-low p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">{we.role} @ {we.company}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {we.start_date?.slice(0, 7)} — {we.is_current ? "Present" : (we.end_date?.slice(0, 7) || "N/A")}
                        </p>
                        {we.description && (
                          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{we.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingWorkExpId(we.id)}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary"
                        >
                          <Plus className="h-4 w-4 rotate-45" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkExp(we.id)}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-red-50 hover:text-red-600"
                          disabled={workExp.isRemoving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ),
              )}

              {(profile?.workExperiences || []).length === 0 && !addingWorkExp && (
                <p className="text-sm text-on-surface-variant">No work experience added yet.</p>
              )}
            </div>
          </SurfaceCard>

          {/* Certifications */}
          <SurfaceCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="font-headline text-2xl font-bold">Certifications</h3>
              </div>
              {!addingCert && (
                <button
                  type="button"
                  onClick={() => setAddingCert(true)}
                  className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              )}
            </div>

            <div className="space-y-4">
              {addingCert && (
                <CertForm
                  onSave={handleAddCert}
                  onCancel={() => setAddingCert(false)}
                  isSaving={certs.isAdding}
                />
              )}

              {(profile?.certifications || []).map((cert) =>
                editingCertId === cert.id ? (
                  <CertForm
                    key={cert.id}
                    initial={cert}
                    onSave={handleUpdateCert}
                    onCancel={() => setEditingCertId(null)}
                    isSaving={certs.isUpdating}
                  />
                ) : (
                  <div key={cert.id} className="rounded-2xl bg-surface-container-low p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">{cert.name}</p>
                        {cert.issuer && (
                          <p className="mt-1 text-xs text-on-surface-variant">{cert.issuer}</p>
                        )}
                        {cert.issued_date && (
                          <p className="text-xs text-outline">{cert.issued_date?.slice(0, 10)}</p>
                        )}
                        {cert.cert_url && (
                          <a
                            href={cert.cert_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 text-xs text-primary underline"
                          >
                            View certificate
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCertId(cert.id)}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary"
                        >
                          <Plus className="h-4 w-4 rotate-45" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCert(cert.id)}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-red-50 hover:text-red-600"
                          disabled={certs.isRemoving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ),
              )}

              {(profile?.certifications || []).length === 0 && !addingCert && (
                <p className="text-sm text-on-surface-variant">No certifications added yet.</p>
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
