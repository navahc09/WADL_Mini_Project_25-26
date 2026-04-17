const VAGUE_PHRASES = [
  "good communication",
  "team player",
  "self-motivated",
  "go-getter",
  "dynamic individual",
  "fast learner",
  "passionate",
];

function checkJD(body) {
  const warnings = [];

  if (!body.salaryLabel && !body.jobPackage && !body.salary_label) {
    warnings.push({
      field: "salary",
      severity: "error",
      message: "Salary/package not specified. Students need this to make informed decisions.",
    });
  }

  if (!body.type && !body.job_type) {
    warnings.push({
      field: "type",
      severity: "warning",
      message: "Job type (Full-time/Internship) not specified.",
    });
  }

  const branchList = body.branches || body.allowed_branches;
  const hasBranches = Array.isArray(branchList)
    ? branchList.length > 0
    : typeof branchList === "string" && branchList.trim().length > 0;
  if (!hasBranches) {
    warnings.push({
      field: "branches",
      severity: "error",
      message: "No eligible branches defined. Without this, all students will see the role regardless of fit.",
    });
  }

  if (body.minCgpa === undefined || body.minCgpa === null || body.minCgpa === "") {
    warnings.push({
      field: "minCgpa",
      severity: "warning",
      message: "No minimum CGPA set. Adding a threshold improves applicant quality.",
    });
  }

  if (!body.deadline) {
    warnings.push({
      field: "deadline",
      severity: "error",
      message: "Application deadline is required.",
    });
  }

  const processList = body.process || body.selectionProcess;
  const hasProcess = Array.isArray(processList)
    ? processList.length > 0
    : typeof processList === "string" && processList.trim().length > 0;
  if (!hasProcess) {
    warnings.push({
      field: "process",
      severity: "warning",
      message: "No selection rounds defined. Candidates benefit from knowing the interview stages.",
    });
  }

  const desc = String(body.description || "");
  if (desc.length < 100) {
    warnings.push({
      field: "description",
      severity: "warning",
      message: `Description is too short (${desc.length} chars). Aim for at least 100 characters.`,
    });
  }

  const descLower = desc.toLowerCase();
  const foundVague = VAGUE_PHRASES.filter((p) => descLower.includes(p));
  if (foundVague.length > 0) {
    warnings.push({
      field: "description",
      severity: "info",
      message: `Description contains vague language: "${foundVague[0]}". Replace with specific skills and deliverables.`,
    });
  }

  if (!body.responsibilities) {
    warnings.push({
      field: "responsibilities",
      severity: "warning",
      message: "Key responsibilities not listed. Candidates need to know what they'll work on.",
    });
  }

  const errors = warnings.filter((w) => w.severity === "error").length;
  const warns = warnings.filter((w) => w.severity === "warning").length;
  const qualityScore = Math.max(0, 100 - errors * 25 - warns * 8);

  return {
    warnings,
    qualityScore,
    canPublish: errors === 0,
  };
}

module.exports = { checkJD };
