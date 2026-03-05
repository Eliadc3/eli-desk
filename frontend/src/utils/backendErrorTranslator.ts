export function translateBackendError(err: any): string {
  const data = err?.response?.data ?? err;

  const FIELD_MAP: Record<string, string> = {
    username: "שם משתמש",
    name: "שם",
    externalRequesterPhone: "טלפון",
    externalRequesterName: "שם",
    hospitalDepartmentId: "מחלקה",
    subject: "נושא",
    description: "תיאור",
    resolutionSummary: "סיכום פתרון",
    statusId: "סטטוס",
    assigneeId: "טכנאי",
  };

  // 1) ✅ Zod / Validation errors: details.fieldErrors
  const fieldErrors = data?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const parts: string[] = [];

    for (const [key, arr] of Object.entries(fieldErrors)) {
      if (!Array.isArray(arr) || arr.length === 0) continue;
      const label = FIELD_MAP[key] ?? key;
      // אם יש כמה הודעות לשדה – נחבר בפסיקים
      const msg = (arr as string[]).join(", ");
      parts.push(`${label}: ${msg}`);
    }

    // לפעמים יש גם formErrors
    const formErrors = data?.details?.formErrors;
    if (Array.isArray(formErrors) && formErrors.length) {
      parts.push(...formErrors);
    }

    if (parts.length) {
      return parts.join(" | ");
    }
  }

  // 2) ✅ רשימת מספרי קריאה (למשל במחיקה כשיש שימוש)
  const ticketNumbers = data?.details?.ticketNumbers;
  if (Array.isArray(ticketNumbers) && ticketNumbers.length) {
    return `לא ניתן לבצע פעולה. הקריאות המשויכות: ${ticketNumbers.join(", ")}`;
  }

  // 3) בסיס: message/error/err.message
  let out =
    typeof err === "string"
      ? err
      : data?.message || data?.error || err?.message || "שגיאה";

  // 4) Prisma P2002 (Unique) – אצלך זה כללי על "כבר קיים"
  if (
    (data?.code === "P2002" || /Unique constraint failed/i.test(String(data?.error ?? ""))) &&
    data?.details &&
    Array.isArray(data.details.target)
  ) {
    out = `כבר קיים שם זהה, יש לבחור שם אחר`;
  }

  // 5) החלפת שמות שדות במחרוזת (fallback)
  Object.entries(FIELD_MAP).forEach(([key, label]) => {
    out = out.replace(new RegExp(key, "g"), label);
  });

  // 6) החלפות/תרגומים נוספים
  out = out
    .replace(/String must contain at least \d+ character\(s\)/i, "חייב להכיל מספר תווים מינימלי")
    .replace(/Cannot save ticket with status RESOLVED\/CLOSED/i, "לא ניתן לסגור קריאה")
    .replace(/without resolution summary/i, "ללא סיכום פתרון")
    .replace(/min \d+ chars?/i, "לפחות 4 תווים")
    .replace(
      /Technician has assigned tickets; reassign first/i,
      "לא ניתן למחוק טכנאי שיש לו קריאות משויכות. יש לבטל שיוך או להעביר את הקריאות לטכנאי אחר."
    )
    .replace(/Username already exists/i, "שם המשתמש כבר קיים. בחר שם משתמש אחר.")
    .replace(/Permission already assigned/i, "ההרשאה כבר משויכת למשתמש.")
    .replace(/Technician must have a department/i, "חובה לבחור מחלקה")
    .replace(/Cannot enable technician without department/i, "לא ניתן להפעיל טכנאי ללא מחלקה");

  return out;
}