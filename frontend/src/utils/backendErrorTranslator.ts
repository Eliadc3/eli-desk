export function translateBackendError(msg: string): string {
  let out = msg;

  const FIELD_MAP: Record<string, string> = {
    externalRequesterPhone: "טלפון",
    externalRequesterName: "שם",
    hospitalDepartmentId: "מחלקה",
    subject: "נושא",
    description: "תיאור",
    resolutionSummary: "סיכום פתרון",
  };

  Object.entries(FIELD_MAP).forEach(([key, label]) => {
    out = out.replace(new RegExp(key, "g"), label);
  });

  out = out
    .replace(/String must contain at least \d+ character/i, "חייב להכיל מספר תווים מינימלי")
    .replace(/Cannot save ticket with status RESOLVED\/CLOSED/i, "לא ניתן לסגור קריאה")
    .replace(/without resolution summary/i, "ללא סיכום פתרון")
    .replace(/min \d+ chars?/i, "לפחות 4 תווים");

  return out;
}
