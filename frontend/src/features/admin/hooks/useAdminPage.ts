import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { hasAnyPermission, useAuth } from "@/context/AuthContext";
import {
  listDepartments,
  createDepartment,
  disableDepartment,
  patchDepartment,
  listTechnicians,
  createTechnician,
  patchTechnician,
  disableTechnician,
  listAdminTicketStatuses,
  createAdminTicketStatus,
  patchAdminTicketStatus,
  disableAdminTicketStatus,
  enableAdminTicketStatus,
  enableDepartment,
  enableTechnician,
  deleteDepartmentPermanent,
  deleteTechnicianPermanent,
} from "@/api/admin";
import { listTechDepartments } from "@/api/departments";
import { translateBackendError } from "@/utils/backendErrorTranslator";
import {
  AdminTab,
  DeptSubTab,
  ActiveView,
  EMPTY_STATUS_FORM,
  EMPTY_TECHNICIAN_FORM,
} from "../utils/adminConstants";
import {
  byNameABC,
  byUserABC,
  extractDeleteDepartmentErrorMessage,
  extractDeleteTechnicianErrorMessage,
  isDeptActive,
  isTechActive,
} from "../utils/adminHelpers";
import type { Permission } from "@/api/auth";

export function useAdminPage() {
  const { me } = useAuth();
  const { toast } = useToast();

  const canTech = hasAnyPermission(me, ["TECH_MANAGE"]);
  const canDept = hasAnyPermission(me, ["DEPT_MANAGE"]);
  const canStatuses = canDept;

  const [tab, setTab] = useState<AdminTab>("departments");
  const [deptTab, setDeptTab] = useState<DeptSubTab>("hospital");
  const [deptView, setDeptView] = useState<ActiveView>("active");
  const [techView, setTechView] = useState<ActiveView>("active");
  const [statusView, setStatusView] = useState<ActiveView>("active");

  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentsAll, setDepartmentsAll] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptType, setNewDeptType] = useState<"TECH" | "HOSPITAL">("HOSPITAL");

  const [techs, setTechs] = useState<any[]>([]);
  const [techsAll, setTechsAll] = useState<any[]>([]);
  const [techDepts, setTechDepts] = useState<{ id: string; name: string }[]>([]);
  const [newTech, setNewTech] = useState<any>(EMPTY_TECHNICIAN_FORM);
  const [techDeptDraft, setTechDeptDraft] = useState<Record<string, string>>({});
  const [techDeptDirty, setTechDeptDirty] = useState<Record<string, boolean>>({});
  const [permDraft, setPermDraft] = useState<Record<string, Permission[]>>({});
  const [permDirty, setPermDirty] = useState<Record<string, boolean>>({});

  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusDraft, setStatusDraft] = useState<Record<string, any>>({});
  const [statusDirty, setStatusDirty] = useState<Record<string, boolean>>({});
  const [newStatus, setNewStatus] = useState<any>(EMPTY_STATUS_FORM);

  const [deptSearch, setDeptSearch] = useState("");
  const [techSearch, setTechSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  const deptActiveFlag = deptView === "active";
  const techActiveFlag = techView === "active";
  const statusActiveFlag = statusView === "active";

  const canCreateTech = useMemo(
    () =>
      String(newTech.name ?? "").trim().length >= 2 &&
      String(newTech.username ?? "").trim().length >= 2 &&
      String(newTech.password ?? "").length >= 6 &&
      String(newTech.techDepartmentId ?? "").trim().length > 0,
    [newTech],
  );

  const canCreateStatus = useMemo(
    () =>
      String(newStatus.key ?? "").trim().length > 0 &&
      String(newStatus.labelHe ?? "").trim().length > 0 &&
      String(newStatus.color ?? "").trim().length > 0 &&
      !Number.isNaN(Number(newStatus.sortOrder)) &&
      Number(newStatus.sortOrder) >= 0,
    [newStatus],
  );

  const refreshDepartments = async () => {
    if (!canDept) return;
    const current = await listDepartments({ active: deptActiveFlag });
    setDepartments((current ?? []).map((x: any) => ({ ...x, __active: deptActiveFlag })).sort(byNameABC));

    const [activeList, inactiveList] = await Promise.all([
      listDepartments({ active: true }),
      listDepartments({ active: false }),
    ]);

    setDepartmentsAll(
      [
        ...((activeList ?? []).map((x: any) => ({ ...x, __active: true })) as any[]),
        ...((inactiveList ?? []).map((x: any) => ({ ...x, __active: false })) as any[]),
      ].sort(byNameABC),
    );
  };

  const refreshTechs = async (active?: boolean) => {
    if (!canTech) return;
    const activeFlag = typeof active === "boolean" ? active : techActiveFlag;
    const list = await listTechnicians({ active: activeFlag });
    setTechs((list ?? []).map((x: any) => ({ ...x, __active: activeFlag })).sort(byUserABC));

    const [activeList, inactiveList] = await Promise.all([
      listTechnicians({ active: true }),
      listTechnicians({ active: false }),
    ]);

    setTechsAll(
      [
        ...((activeList ?? []).map((x: any) => ({ ...x, __active: true })) as any[]),
        ...((inactiveList ?? []).map((x: any) => ({ ...x, __active: false })) as any[]),
      ].sort(byUserABC),
    );

    const nextPermDraft: Record<string, Permission[]> = {};
    const nextDeptDraft: Record<string, string> = {};
    for (const tech of list ?? []) {
      nextPermDraft[tech.id] = (tech.permissions ?? []).map((x: any) => x.perm);
      nextDeptDraft[tech.id] = tech.techDepartmentId ?? "";
    }
    setPermDraft(nextPermDraft);
    setPermDirty({});
    setTechDeptDraft(nextDeptDraft);
    setTechDeptDirty({});

    const departments = await listTechDepartments();
    setTechDepts((departments ?? []).map((x: any) => ({ id: x.id, name: x.name })).sort(byNameABC));
  };

  const refreshStatuses = async () => {
    if (!canStatuses) return;
    const items = await listAdminTicketStatuses();
    setStatuses(items ?? []);
    const nextDraft: Record<string, any> = {};
    (items ?? []).forEach((item: any) => {
      nextDraft[item.id] = { ...item };
    });
    setStatusDraft(nextDraft);
    setStatusDirty({});
  };

  const refreshAll = async () => {
    await Promise.all([refreshDepartments(), refreshTechs(), refreshStatuses()]);
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "departments") refreshDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptView]);

  useEffect(() => {
    if (tab === "technicians") refreshTechs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techView]);

  const deptQuery = deptSearch.trim().toLowerCase();
  const departmentsToRender = (deptQuery ? departmentsAll : departments)
    .filter((department) => department.type === (deptTab === "hospital" ? "HOSPITAL" : "TECH"))
    .filter((department) => (deptQuery ? String(department?.name ?? "").toLowerCase().includes(deptQuery) : true));

  const techQuery = techSearch.trim().toLowerCase();
  const techsToRender = (techQuery ? techsAll : techs).filter((technician) => {
    if (!techQuery) return true;
    const name = String(technician?.name ?? "").toLowerCase();
    const username = String(technician?.username ?? "").toLowerCase();
    const deptName = String(technician?.techDepartment?.name ?? "").toLowerCase();
    return name.includes(techQuery) || username.includes(techQuery) || deptName.includes(techQuery);
  });

  const statusQuery = statusSearch.trim().toLowerCase();
  const statusesToRender = (statuses ?? [])
    .filter((status) => {
      const draft = statusDraft[status.id] ?? status;
      return statusActiveFlag ? Boolean(draft.isActive) : !Boolean(draft.isActive);
    })
    .filter((status) => {
      if (!statusQuery) return true;
      const draft = statusDraft[status.id] ?? status;
      const key = String(draft?.key ?? "").toLowerCase();
      const labelHe = String(draft?.labelHe ?? "").toLowerCase();
      return key.includes(statusQuery) || labelHe.includes(statusQuery);
    });

  const navigateSearch = async (raw: string) => {
    const q = raw.trim().toLowerCase();
    if (!q) return;

    if (departmentsAll.length === 0 || techsAll.length === 0) {
      await Promise.all([refreshDepartments(), refreshTechs()]);
    }

    const department = (departmentsAll ?? []).find((item) => String(item?.name ?? "").toLowerCase().includes(q));
    if (department) {
      const active = isDeptActive(department);
      setTab("departments");
      setDeptTab(department.type === "TECH" ? "tech" : "hospital");
      setDeptView(active ? "active" : "archived");
      setDeptSearch(raw);
      setPendingScrollId(`dept-${department.id}`);
      return;
    }

    const technician = (techsAll ?? []).find((item) => {
      const name = String(item?.name ?? "").toLowerCase();
      const username = String(item?.username ?? "").toLowerCase();
      const deptName = String(item?.techDepartment?.name ?? "").toLowerCase();
      return name.includes(q) || username.includes(q) || deptName.includes(q);
    });

    if (technician) {
      const active = isTechActive(technician);
      setTab("technicians");
      setTechView(active ? "active" : "archived");
      setTechSearch(raw);
      setPendingScrollId(`tech-${technician.id}`);
      return;
    }

    if ((statuses ?? []).length === 0) await refreshStatuses();

    const status = (statuses ?? []).find((item) => {
      const draft = statusDraft?.[item.id] ?? item;
      const key = String(draft?.key ?? "").toLowerCase();
      const labelHe = String(draft?.labelHe ?? "").toLowerCase();
      return key.includes(q) || labelHe.includes(q);
    });

    if (status) {
      setTab("ticket-statuses");
      setStatusSearch(raw);
      setPendingScrollId(`status-${status.id}`);
      return;
    }

    toast({ title: "לא נמצאה תוצאה" });
  };

  useEffect(() => {
    if (!pendingScrollId) return;
    const timer = setTimeout(() => {
      const element = document.getElementById(pendingScrollId);
      if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      setPendingScrollId(null);
    }, 60);
    return () => clearTimeout(timer);
  }, [pendingScrollId, tab, deptView, techView, deptTab, departments, techs, statuses]);

  const createDepartmentHandler = async () => {
    try {
      if (!newDeptName.trim()) return;
      await createDepartment({ name: newDeptName.trim(), type: newDeptType });
      setNewDeptName("");
      await refreshDepartments();
      toast({ title: "מחלקה נוצרה בהצלחה" });
    } catch (error: any) {
      toast({ title: "נכשל", description: translateBackendError(error), variant: "destructive" });
    }
  };

  const renameDepartment = async (department: any) => {
    const name = prompt("New name", department.name);
    if (!name) return;
    try {
      await patchDepartment(department.id, { name });
      await refreshDepartments();
    } catch (error: any) {
      toast({ title: "נכשל", description: translateBackendError(error), variant: "destructive" });
    }
  };

  const disableDepartmentHandler = async (departmentId: string) => {
    if (!confirm("Disable department?")) return;
    await disableDepartment(departmentId);
    await refreshDepartments();
    await refreshTechs();
  };

  const enableDepartmentHandler = async (departmentId: string) => {
    await enableDepartment(departmentId);
    await refreshDepartments();
    await refreshTechs();
  };

  const deleteDepartmentPermanently = async (departmentId: string) => {
    if (!confirm("בטוח למחוק את המחלקה לצמיתות?")) return;
    try {
      await deleteDepartmentPermanent(departmentId);
      await refreshDepartments();
      toast({ title: "המחלקה נמחקה לצמיתות" });
    } catch (error: any) {
      const message = extractDeleteDepartmentErrorMessage(error);
      toast({
        title: "נכשל",
        description: message ?? translateBackendError(error),
        variant: "destructive",
      });
    }
  };

  const createTechnicianHandler = async () => {
    try {
      const techDepartmentId = String(newTech.techDepartmentId ?? "").trim();
      if (!techDepartmentId) {
        toast({ title: "נכשל", description: "חובה לבחור מחלקה", variant: "destructive" });
        return;
      }
      await createTechnician({
        name: String(newTech.name ?? "").trim(),
        username: String(newTech.username ?? "").trim(),
        password: String(newTech.password ?? ""),
        techDepartmentId,
        permissions: newTech.permissions ?? [],
      });
      setNewTech({ ...EMPTY_TECHNICIAN_FORM });
      await refreshTechs();
      toast({ title: "טכנאי נוצר בהצלחה" });
    } catch (error: any) {
      const data = error?.response?.data;
      const fieldErrors = data?.details?.fieldErrors;
      const niceDetails = fieldErrors
        ? Object.entries(fieldErrors)
            .filter(([, arr]) => Array.isArray(arr) && arr.length)
            .map(([key, arr]) => `${key}: ${(arr as string[])[0]}`)
            .join(" | ")
        : null;

      toast({
        title: "נכשל",
        description: niceDetails ? translateBackendError(niceDetails) : translateBackendError(error),
        variant: "destructive",
      });
    }
  };

  const renameTechnician = async (technician: any) => {
    const name = prompt("New name", technician.name);
    if (!name) return;
    try {
      await patchTechnician(technician.id, { name });
      await refreshTechs();
    } catch (error: any) {
      toast({ title: "נכשל", description: translateBackendError(error), variant: "destructive" });
    }
  };

  const disableTechnicianHandler = async (technicianId: string) => {
    if (!confirm("Disable technician?")) return;
    await disableTechnician(technicianId);
    await refreshTechs();
    await refreshDepartments();
  };

  const enableTechnicianHandler = async (technician: any) => {
    try {
      const deptId = String(techDeptDraft[technician.id] ?? technician.techDepartmentId ?? "").trim();
      if (!deptId) {
        toast({ title: "נכשל", description: "חובה לבחור מחלקה כדי להפעיל טכנאי", variant: "destructive" });
        return;
      }
      await enableTechnician(technician.id);
      setTechSearch("");
      setTechView("active");
      await refreshTechs(true);
      setPendingScrollId(`tech-${technician.id}`);
      await refreshDepartments();
      toast({ title: "טכנאי הופעל והועבר לרשימת הפעילים" });
    } catch (error: any) {
      toast({ title: "נכשל", description: translateBackendError(error), variant: "destructive" });
    }
  };

  const deleteTechnicianPermanently = async (technician: any) => {
    if (!confirm("בטוח למחוק את הטכנאי לצמיתות?")) return;
    try {
      await deleteTechnicianPermanent(technician.id);
      await refreshTechs(false);
      toast({ title: "הטכנאי נמחק לצמיתות" });
    } catch (error: any) {
      const message = extractDeleteTechnicianErrorMessage(error);
      toast({
        title: "נכשל",
        description: message ?? translateBackendError(error),
        variant: "destructive",
      });
    }
  };

  const saveTechnicianChanges = async (technician: any) => {
    const permsIsDirty = Boolean(permDirty[technician.id]);
    const deptIsDirty = Boolean(techDeptDirty[technician.id]);
    const payload: any = {};
    if (permsIsDirty) payload.permissions = permDraft[technician.id] ?? [];
    if (deptIsDirty) payload.techDepartmentId = String(techDeptDraft[technician.id] ?? "").trim();

    if (deptIsDirty && !payload.techDepartmentId) {
      toast({ title: "נכשל", description: "חובה לבחור מחלקה כדי לשמור טכנאי", variant: "destructive" });
      return;
    }

    try {
      await patchTechnician(technician.id, payload);
      await refreshTechs();
      toast({ title: "נשמר בהצלחה" });
    } catch (error: any) {
      toast({ title: "נכשל", description: translateBackendError(error), variant: "destructive" });
    }
  };

  const rollbackTechnicianChanges = (technician: any) => {
    const originalPerms: Permission[] = (technician.permissions ?? []).map((x: any) => x.perm);
    const originalDeptId: string = technician.techDepartmentId ?? "";
    setPermDraft((prev) => ({ ...prev, [technician.id]: originalPerms }));
    setPermDirty((prev) => ({ ...prev, [technician.id]: false }));
    setTechDeptDraft((prev) => ({ ...prev, [technician.id]: originalDeptId }));
    setTechDeptDirty((prev) => ({ ...prev, [technician.id]: false }));
  };

  const createStatusHandler = async () => {
    try {
      if (!String(newStatus.key ?? "").trim() || !String(newStatus.labelHe ?? "").trim()) return;
      await createAdminTicketStatus({
        key: String(newStatus.key).trim().toUpperCase(),
        labelHe: String(newStatus.labelHe).trim(),
        color: String(newStatus.color ?? "").trim() ? String(newStatus.color).trim() : null,
        sortOrder: Number(newStatus.sortOrder) || 0,
        isActive: true,
        isDefault: Boolean(newStatus.isDefault),
      });
      setNewStatus({ ...EMPTY_STATUS_FORM });
      await refreshStatuses();
      toast({ title: "סטטוס נוצר בהצלחה" });
    } catch (error: any) {
      toast({ title: "נכשל", description: translateBackendError(error), variant: "destructive" });
    }
  };

  const updateStatusField = (statusId: string, patch: Record<string, any>) => {
    setStatusDraft((prev) => ({ ...prev, [statusId]: { ...(prev[statusId] ?? {}), ...patch } }));
    setStatusDirty((prev) => ({ ...prev, [statusId]: true }));
  };

  const saveStatusChanges = async (status: any) => {
    const draft = statusDraft[status.id] ?? status;
    try {
      await patchAdminTicketStatus(status.id, {
        key: String(draft.key ?? "").trim().toUpperCase(),
        labelHe: String(draft.labelHe ?? "").trim(),
        color: String(draft.color ?? "").trim() ? String(draft.color).trim() : null,
        sortOrder: Number(draft.sortOrder) || 0,
        isDefault: Boolean(draft.isDefault),
      });
      await refreshStatuses();
      toast({ title: "נשמר בהצלחה" });
    } catch (error: any) {
      toast({ title: "נכשל", description: translateBackendError(error), variant: "destructive" });
    }
  };

  const rollbackStatusChanges = (status: any) => {
    setStatusDraft((prev) => ({ ...prev, [status.id]: { ...status } }));
    setStatusDirty((prev) => ({ ...prev, [status.id]: false }));
  };

  const disableStatusHandler = async (statusId: string) => {
    if (!confirm("Disable status?")) return;
    try {
      await disableAdminTicketStatus(statusId);
      await refreshStatuses();
    } catch (error: any) {
      toast({ title: "נכשל", description: translateBackendError(error), variant: "destructive" });
    }
  };

  const enableStatusHandler = async (statusId: string) => {
    try {
      await enableAdminTicketStatus(statusId);
      await refreshStatuses();
    } catch (error: any) {
      toast({ title: "נכשל", description: translateBackendError(error), variant: "destructive" });
    }
  };

  return {
    me,
    tab,
    setTab,
    deptTab,
    setDeptTab,
    deptView,
    setDeptView,
    techView,
    setTechView,
    statusView,
    setStatusView,
    canTech,
    canDept,
    canStatuses,
    globalSearch,
    setGlobalSearch,
    navigateSearch,
    newDeptName,
    setNewDeptName,
    newDeptType,
    setNewDeptType,
    createDepartmentHandler,
    deptSearch,
    setDeptSearch,
    departmentsToRender,
    deptQuery,
    deptActiveFlag,
    isDeptActive,
    renameDepartment,
    disableDepartmentHandler,
    enableDepartmentHandler,
    deleteDepartmentPermanently,
    newTech,
    setNewTech,
    techDepts,
    canCreateTech,
    createTechnicianHandler,
    techSearch,
    setTechSearch,
    techQuery,
    techsToRender,
    techActiveFlag,
    isTechActive,
    permDraft,
    setPermDraft,
    permDirty,
    setPermDirty,
    techDeptDraft,
    setTechDeptDraft,
    techDeptDirty,
    setTechDeptDirty,
    renameTechnician,
    disableTechnicianHandler,
    enableTechnicianHandler,
    deleteTechnicianPermanently,
    saveTechnicianChanges,
    rollbackTechnicianChanges,
    newStatus,
    setNewStatus,
    canCreateStatus,
    createStatusHandler,
    statusSearch,
    setStatusSearch,
    statusQuery,
    statusesToRender,
    statusDraft,
    statusDirty,
    updateStatusField,
    saveStatusChanges,
    rollbackStatusChanges,
    disableStatusHandler,
    enableStatusHandler,
    refreshStatuses,
  };
}
