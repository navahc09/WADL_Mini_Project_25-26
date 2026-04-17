function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getAllowedBranches(job) {
  return job.allowedBranches || job.allowed_branches || job.branches || [];
}

function getRequiredSkills(job) {
  return job.requiredSkills || job.required_skills || job.tags || [];
}

/**
 * checkEligibility — evaluates hard-gate criteria (branch, CGPA, backlogs).
 * Returns { eligible: bool, hardFailures: string[] }.
 * Score is NOT computed here — use computeMatchScore() only for eligible candidates.
 */
function checkEligibility(profile, job) {
  const hardFailures = [];
  const minCgpa = Number(job.minCgpa ?? job.min_cgpa ?? 0);
  const maxActiveBacklogs = Number(job.maxActiveBacklogs ?? job.max_active_backlogs ?? 0);
  const requiredYear = job.graduationYear ?? job.graduation_year ?? null;

  if (Number(profile.cgpa) < minCgpa) {
    hardFailures.push(`CGPA ${profile.cgpa} is below required ${minCgpa}`);
  }

  if (Number(profile.activeBacklogs ?? profile.active_backlogs ?? 0) > maxActiveBacklogs) {
    hardFailures.push(`Active backlogs exceed allowed maximum of ${maxActiveBacklogs}`);
  }

  const allowedBranches = getAllowedBranches(job).map(normalize);
  const profileBranch = normalize(profile.branch);
  const profileBranchCode = normalize(profile.branchCode ?? profile.branch_code);

  if (
    allowedBranches.length > 0 &&
    !allowedBranches.includes("all branches") &&
    !allowedBranches.includes(profileBranch) &&
    !allowedBranches.includes(profileBranchCode)
  ) {
    hardFailures.push(`Branch ${profile.branchCode ?? profile.branch} is not eligible for this role`);
  }

  if (requiredYear && Number(profile.graduationYear ?? profile.graduation_year) !== Number(requiredYear)) {
    hardFailures.push(`Graduation year ${profile.graduationYear ?? profile.graduation_year} does not match required ${requiredYear}`);
  }

  return {
    eligible: hardFailures.length === 0,
    reasons: hardFailures,
    hardFailures,
  };
}

/**
 * computeMatchScore — ONLY call this for eligible candidates.
 * Returns a 0-100 fit score based on CGPA, skills, certs, experience.
 */
function computeMatchScore(profile, job) {
  let score = 45;
  score += Math.min(Number(profile.cgpa || 0) * 4, 35);

  const profileSkills = (profile.skills || []).map(normalize);
  const targetSkills = getRequiredSkills(job).map(normalize).filter(Boolean);

  if (targetSkills.length > 0) {
    const matches = targetSkills.filter((skill) => profileSkills.includes(skill)).length;
    score += Math.round((matches / targetSkills.length) * 15);
  } else {
    score += 8;
  }

  const certificationCount = (profile.certifications || []).length;
  const experienceCount = (profile.workExperiences || profile.work_experiences || []).length;
  score += Math.min(certificationCount * 3, 6);
  score += Math.min(experienceCount * 4, 8);

  return Math.max(0, Math.min(Math.round(score), 100));
}

module.exports = {
  checkEligibility,
  computeMatchScore,
};
