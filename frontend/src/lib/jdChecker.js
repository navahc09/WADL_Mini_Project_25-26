const VAGUE_PHRASES = [
  "good communication",
  "team player",
  "self-motivated",
  "go-getter",
  "dynamic individual",
  "fast learner",
  "passionate",
];

export function checkJDClient(values) {
  const warnings = [];

  if (!values.jobPackage && !values.salaryLabel) {
    warnings.push({ field: "salary", severity: "error", message: "Salary/package not specified. Students need this to make informed decisions." });
  }

  if (!values.type) {
    warnings.push({ field: "type", severity: "warning", message: "Job type (Full-time/Internship) not specified." });
  }

  const branches = typeof values.branches === "string" ? values.branches.trim() : "";
  if (!branches) {
    warnings.push({ field: "branches", severity: "error", message: "No eligible branches defined. Without this, all students will see the role." });
  }

  if (values.minCgpa === undefined || values.minCgpa === null || values.minCgpa === "") {
    warnings.push({ field: "minCgpa", severity: "warning", message: "No minimum CGPA set. Adding a threshold improves applicant quality." });
  }

  if (!values.deadline) {
    warnings.push({ field: "deadline", severity: "error", message: "Application deadline is required." });
  }

  if (!values.process && !values.selectionProcess) {
    warnings.push({ field: "process", severity: "warning", message: "No selection rounds defined. Candidates benefit from knowing the interview stages." });
  }

  const desc = String(values.description || "");
  if (desc.length < 100) {
    warnings.push({ field: "description", severity: "warning", message: `Description is too short (${desc.length} chars). Aim for at least 100 characters.` });
  }

  const descLower = desc.toLowerCase();
  const foundVague = VAGUE_PHRASES.filter((p) => descLower.includes(p));
  if (foundVague.length > 0) {
    warnings.push({ field: "description", severity: "info", message: `Description uses vague language: "${foundVague[0]}". Replace with specific skills and deliverables.` });
  }

  if (!values.responsibilities) {
    warnings.push({ field: "responsibilities", severity: "warning", message: "Key responsibilities not listed." });
  }

  const errors = warnings.filter((w) => w.severity === "error").length;
  const warns = warnings.filter((w) => w.severity === "warning").length;
  const qualityScore = Math.max(0, 100 - errors * 25 - warns * 8);

  return { warnings, qualityScore, canPublish: errors === 0 };
}
