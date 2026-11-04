const DISALLOWED = [
  /erase\s+(?:logs|traces|evidence)/i,
  /leave\s+no\s+traces/i,
  /make\s+(?:the\s+)?intrusion\s+undetectable/i,
  /steal\s+(?:credentials|passwords|tokens)/i,
  /exfiltrat(?:e|ion)\s+(?:data|credentials)/i,
  /deploy\s+(?:ransomware|malware)/i,
  /bypass\s+(?:authentication|access\s+controls)\s+on\s+(?:a\s+)?(?:third.party|real|public)/i
];

export function validateResearchRequest(input) {
  const objective = String(input?.objective || "").trim();
  const scope = String(input?.scope || "").trim();
  const notes = String(input?.notes || "").trim();
  const errors = [];

  if (objective.length < 12) errors.push("Describe the research objective in at least 12 characters.");
  if (objective.length > 1200) errors.push("Objective must be 1,200 characters or fewer.");
  if (scope.length < 8) errors.push("Describe the authorised lab, owned system, or supplied material being assessed.");
  if (scope.length > 800) errors.push("Scope must be 800 characters or fewer.");
  if (notes.length > 5000) errors.push("Notes must be 5,000 characters or fewer.");
  if (input?.authorised !== true) errors.push("Explicit confirmation of authorisation is required.");
  if (DISALLOWED.some(pattern => pattern.test(objective + " " + notes))) {
    errors.push("This workspace does not support intrusion concealment, evidence destruction, credential theft, or unauthorised access.");
  }

  return { ok: errors.length === 0, errors, value: { objective, scope, notes } };
}
