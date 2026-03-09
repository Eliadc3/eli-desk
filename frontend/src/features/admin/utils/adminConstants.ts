import type { Permission } from "@/api/auth";

export type AdminTab = "departments" | "technicians" | "ticket-statuses";
export type DeptSubTab = "hospital" | "tech";
export type ActiveView = "active" | "archived";

export const PERM_GROUPS: { title: string; items: { key: Permission; label: string }[] }[] = [
  {
    title: "הרשאות ניהול",
    items: [
      { key: "TECH_MANAGE", label: "ניהול טכנאים" },
      { key: "DEPT_MANAGE", label: "ניהול מחלקות" },
    ],
  },
  {
    title: "הרשאות קריאות",
    items: [
      { key: "TICKET_DELETE", label: "מחיקת קריאות" },
      { key: "TICKET_DUPLICATE", label: "שכפול קריאות" },
      { key: "TICKET_REASSIGN", label: "שיוך קריאה לטכנאי אחר" },
    ],
  },
];

export const EMPTY_TECHNICIAN_FORM = {
  name: "",
  username: "",
  password: "",
  techDepartmentId: "",
  permissions: [] as Permission[],
};

export const EMPTY_STATUS_FORM = {
  key: "",
  labelHe: "",
  color: "#3B82F6",
  sortOrder: 0,
  isActive: true,
  isDefault: false,
};
