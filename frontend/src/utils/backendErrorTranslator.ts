export function translateBackendError(err: any): string {
  const data = err?.response?.data ?? err; 
let out =
  typeof err === "string"
    ? err
    : data?.message || data?.error || err?.message || "שגיאה";


  const FIELD_MAP: Record<string, string> = {
  username: "שם משתמש",
  name: "שם",
  externalRequesterPhone: "טלפון",
  externalRequesterName: "שם",
  hospitalDepartmentId: "מחלקה",
  subject: "נושא",
  description: "תיאור",
  resolutionSummary: "סיכום פתרון",
};

// Prisma P2002 (Unique)
if (
  (data?.code === "P2002" || /Unique constraint failed/i.test(String(data?.error ?? ""))) &&
  data?.details &&
  Array.isArray(data.details.target)
) {
  const fieldMap: Record<string, string> = {
    name: "שם",
    type: "סוג",
    username: "שם משתמש",
    externalRequesterPhone: "טלפון",
    externalRequesterName: "שם",
    hospitalDepartmentId: "מחלקה",
    subject: "נושא",
    description: "תיאור",
    resolutionSummary: "סיכום פתרון",
  };

  out = `כבר קיים שם זהה, יש לבחור שם אחר`;
}


  Object.entries(FIELD_MAP).forEach(([key, label]) => {
    out = out.replace(new RegExp(key, "g"), label);
  });

  out = out
    .replace(/String must contain at least \d+ character(s)/i, "חייב להכיל מספר תווים מינימלי")
    .replace(/Cannot save ticket with status RESOLVED\/CLOSED/i, "לא ניתן לסגור קריאה")
    .replace(/without resolution summary/i, "ללא סיכום פתרון")
    .replace(/min \d+ chars?/i, "לפחות 4 תווים")
    .replace(/Technician has assigned tickets; reassign first/i,
  "לא ניתן למחוק טכנאי שיש לו קריאות משויכות. יש לבטל שיוך או להעביר את הקריאות לטכנאי אחר.")
    .replace(/Username already exists/i, "שם המשתמש כבר קיים. בחר שם משתמש אחר.")
    .replace(/Permission already assigned/i, "ההרשאה כבר משויכת למשתמש.")
;

  return out;
}
