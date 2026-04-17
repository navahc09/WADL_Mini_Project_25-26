function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function companyInitials(companyName) {
  return String(companyName || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatDateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(",", "");
}

function formatDateTimeLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(",", "");
}

function formatRelative(value) {
  if (!value) return "Just now";
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours <= 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return formatDateLabel(value);
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function mapJobType(jobType) {
  const normalized = String(jobType || "").toLowerCase();
  if (normalized === "full_time") return "Full-time";
  if (normalized === "internship") return "Internship";
  if (normalized === "contract") return "Contract";
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function mapWorkMode(workMode) {
  const normalized = String(workMode || "").toLowerCase();
  if (normalized === "on_site") return "On-site";
  if (normalized === "remote") return "Remote";
  if (normalized === "hybrid") return "Hybrid";
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function mapFrontendJobStatus(status, deadline) {
  if (status === "draft") return "Draft";
  if (status === "closed") return "Closed";
  if (status === "completed") return "Completed";

  const diffMs = new Date(deadline).getTime() - Date.now();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (status === "open" && diffDays <= 3) return "Closing Soon";
  return "Open";
}

function mapApplicationStatus(status) {
  if (status === "interview_scheduled" || status === "interview_completed") return "interview";
  if (status === "offered" || status === "accepted") return "offer";
  return status;
}

function mapApplicantStatus(status) {
  if (status === "offered" || status === "accepted") {
    return "Offered";
  }
  if (status === "shortlisted" || status === "interview_scheduled" || status === "interview_completed") {
    return "Shortlisted";
  }
  if (status === "rejected" || status === "withdrawn") {
    return "Rejected";
  }
  return "Under Review";
}

function buildApplicationPhase(status, rounds = []) {
  if (status === "interview_scheduled") {
    const nextRound = rounds.find((round) => round.result === "pending");
    return nextRound?.scheduled_at
      ? `${nextRound.round_type || "Interview"} scheduled for ${formatDateTimeLabel(nextRound.scheduled_at)}`
      : "Interview round scheduled";
  }

  if (status === "interview_completed") return "Interview completed";
  if (status === "shortlisted") return "Awaiting next round";
  if (status === "offered") return "Offer released";
  if (status === "accepted") return "Offer accepted";
  if (status === "rejected") return "Application closed";
  if (status === "withdrawn") return "Application withdrawn";
  return "Profile under review";
}

function buildApplicationTimeline(status, rounds = []) {
  return [
    { label: "Applied", done: true },
    {
      label: "Shortlisted",
      done: ["shortlisted", "interview_scheduled", "interview_completed", "offered", "accepted"].includes(status),
    },
    {
      label: "Interview",
      done: ["interview_scheduled", "interview_completed", "offered", "accepted"].includes(status),
      date: rounds[0]?.scheduled_at ? formatDateLabel(rounds[0].scheduled_at) : "Pending",
    },
    {
      label: "Offer",
      done: ["offered", "accepted"].includes(status),
    },
  ].map((step) => ({
    ...step,
    date:
      step.date ||
      (step.done ? (step.label === "Applied" ? "Done" : "Completed") : "Pending"),
  }));
}

function mapStudentProfile(row, stats = {}) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.full_name,
    firstName: row.full_name?.split(" ")[0] || row.full_name,
    email: row.email,
    phone: row.phone,
    branch: row.branch,
    branchCode: row.branch_code,
    graduationYear: parseNumber(row.graduation_year),
    cgpa: parseNumber(row.cgpa),
    activeBacklogs: parseNumber(row.active_backlogs),
    rollNumber: row.roll_number,
    city: row.city,
    headline: row.headline,
    about: row.about,
    skills: row.skills || [],
    achievements: row.achievements || [],
    preferences: {
      locations: row.preferred_locations || [],
      domains: row.preferred_domains || [],
      expectedSalary: row.expected_salary_label || "",
    },
    metrics: {
      profileCompleteness: stats.profileCompleteness ?? (row.profile_complete ? 92 : 68),
      applicationsSent: stats.applicationsSent ?? 0,
      activeInterviews: stats.activeInterviews ?? 0,
      offersReceived: stats.offersReceived ?? 0,
      responseRate: stats.responseRate ?? 0,
    },
    upcomingEvents: row.upcoming_events || [],
    certifications: row.certifications || [],
    workExperiences: row.work_experiences || [],
  };
}

function mapDocumentRow(row) {
  return {
    id: row.id,
    name: row.file_name,
    type: String(row.doc_type || "")
      .split("_")
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" "),
    size: formatBytes(row.file_size_bytes),
    updatedAt: formatRelative(row.updated_at || row.uploaded_at),
    primary: Boolean(row.is_primary),
  };
}

function mapJobRow(row, options = {}) {
  return {
    id: row.id,
    title: row.title,
    company: row.company_name,
    companyInitials: companyInitials(row.company_name),
    location: row.location,
    mode: mapWorkMode(row.work_mode),
    type: mapJobType(row.job_type),
    salaryLabel:
      row.salary_label || (row.salary_lpa ? `INR ${parseNumber(row.salary_lpa)} LPA` : "TBD"),
    packageLpa: parseNumber(row.salary_lpa),
    minCgpa: parseNumber(row.min_cgpa),
    branches: row.allowed_branches || [],
    deadline: formatDateLabel(row.application_deadline),
    deadlineRaw: row.application_deadline || null,
    posted: formatRelative(row.created_at),
    featured: Boolean(row.featured),
    openings: parseNumber(row.openings, 1),
    description: row.description,
    aboutCompany: row.about_company,
    responsibilities: row.responsibilities || [],
    requirements: row.requirements || [],
    process: row.process || [],
    perks: row.perks || [],
    tags: row.tags || [],
    maxActiveBacklogs: parseNumber(row.max_active_backlogs, 0),
    applicants: parseNumber(options.applicantCount, 0),
    shortlistRate: parseNumber(options.shortlistRate, 0),
    status: mapFrontendJobStatus(row.status, row.application_deadline),
    newApplicants: parseNumber(options.newApplicants, 0),
    eligible: options.eligible ?? true,
    reasons: options.reasons || [],
  };
}

function mapApplicationRow(row) {
  const rounds = row.interview_rounds || [];
  const frontendStatus = mapApplicationStatus(row.status);

  return {
    id: row.id,
    jobId: row.job_id,
    role: row.title,
    company: row.company_name,
    status: frontendStatus,
    rawStatus: row.status,
    phase: buildApplicationPhase(row.status, rounds),
    appliedOn: formatDateLabel(row.applied_at),
    lastUpdated: formatRelative(row.updated_at),
    salary:
      row.salary_label || row.snapshot_data?.salary_label || `INR ${parseNumber(row.salary_lpa)} LPA`,
    matchScore: parseNumber(row.match_score),
    timeline: buildApplicationTimeline(row.status, rounds),
    snapshot: row.snapshot_data,
    documentId: row.document_id || null,
    resumeFileName: row.snapshot_data?.resume_file_name || null,
    deadline: row.application_deadline || null,
    rounds: rounds.map((r) => ({
      type: r.round_type,
      scheduledAt: r.scheduled_at ? formatDateTimeLabel(r.scheduled_at) : null,
      result: r.result,
    })),
  };
}

module.exports = {
  companyInitials,
  formatDateLabel,
  formatDateTimeLabel,
  formatRelative,
  formatBytes,
  mapApplicationRow,
  mapApplicantStatus,
  mapDocumentRow,
  mapJobRow,
  mapStudentProfile,
  parseNumber,
};
