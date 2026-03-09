export const byNameABC = (a: any, b: any) =>
  String(a?.name ?? "").localeCompare(String(b?.name ?? ""), ["he", "en"], { sensitivity: "base" });

export const byUserABC = (a: any, b: any) => {
  const nameCmp = String(a?.name ?? "").localeCompare(String(b?.name ?? ""), ["he", "en"], { sensitivity: "base" });
  if (nameCmp !== 0) return nameCmp;
  return String(a?.username ?? "").localeCompare(String(b?.username ?? ""), ["he", "en"], { sensitivity: "base" });
};

export function isDeptActive(department: any) {
  if (typeof department?.__active === "boolean") return department.__active;
  return true;
}

export function isTechActive(technician: any) {
  if (typeof technician?.isActive === "boolean") return technician.isActive;
  if (typeof technician?.__active === "boolean") return technician.__active;
  return true;
}

export function extractDeleteDepartmentErrorMessage(error: any) {
  const nums: number[] = error?.response?.data?.details?.ticketNumbers ?? [];
  if (nums.length) {
    return `לא ניתן למחוק. קיימות קריאות משויכות למחלקה: ${nums.join(", ")}`;
  }

  const users = error?.response?.data?.details?.users ?? [];
  if (Array.isArray(users) && users.length) {
    const list = users.map((u: any) => `${u?.name ?? "-"} (${u?.username ?? "-"})`).join(", ");
    return `לא ניתן למחוק: יש טכנאים משויכים למחלקה: ${list}`;
  }

  return null;
}

export function extractDeleteTechnicianErrorMessage(error: any) {
  const nums: number[] = error?.response?.data?.details?.ticketNumbers ?? [];
  if (nums.length) {
    return `לא ניתן למחוק. קיימות קריאות משויכות לטכנאי: ${nums.join(", ")}`;
  }
  return null;
}
