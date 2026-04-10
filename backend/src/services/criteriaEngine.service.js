function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getAllowedBranches(job) {
  return job.allowedBranches || job.allowed_branches || job.branches || [];
}

function getRequiredSkills(job) {
  return job.requiredSkills || job.required_skills || job.tags || [];
}

function checkEligibility(profile, job) {
  const reasons = [];
  const minCgpa = Number(job.minCgpa ?? job.min_cgpa ?? 0);
  const maxActiveBacklogs = Number(job.maxActiveBacklogs ?? job.max_active_backlogs ?? 0);
  const requiredGraduationYear = job.graduationYear ?? job.graduation_year;

  if (Number(profile.cgpa) < minCgpa) {
    reasons.push(`CGPA ${profile.cgpa} is below required ${minCgpa}`);
  }

  if (Number(profile.activeBacklogs ?? profile.active_backlogs ?? 0) > maxActiveBacklogs) {
    reasons.push(`Active backlogs exceed allowed maximum of ${maxActiveBacklogs}`);
  }

  if (
    requiredGraduationYear &&
    Number(profile.graduationYear ?? profile.graduation_year) !== Number(requiredGraduationYear)
  ) {
    reasons.push(`Graduation year ${profile.graduationYear ?? profile.graduation_year} is not eligible`);
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
    reasons.push(`Branch ${profile.branchCode ?? profile.branch} is not eligible for this role`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

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
