import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
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
} from "@/api/admin";
import type { Permission } from "@/api/auth";
import { listTechDepartments } from "@/api/departments";
import { translateBackendError } from "@/utils/backendErrorTranslator";


const PERMS: { key: Permission; label: string }[] = [
  { key: "TICKET_DELETE", label: "מחיקת קריאות" },
  { key: "TICKET_DUPLICATE", label: "שכפול קריאות" },
  { key: "TICKET_REASSIGN", label: "החלפת מטפלים" },
  { key: "TECH_MANAGE", label: "ניהול טכנאים" },
  { key: "DEPT_MANAGE", label: "ניהול מחלקות" },
];

type AdminTab = "departments" | "technicians" | "ticket-statuses";
type DeptSubTab = "hospital" | "tech";
type ActiveView = "active" | "archived";

export default function Admin() {
  const { me } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");


  const canTech = hasAnyPermission(me, ["TECH_MANAGE"]);
  const canDept = hasAnyPermission(me, ["DEPT_MANAGE"]);
  const canStatuses = canDept; // כרגע אותו gate

  const [tab, setTab] = useState<AdminTab>("departments");
  const [deptTab, setDeptTab] = useState<DeptSubTab>("hospital");

  // Departments
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptType, setNewDeptType] = useState<"TECH" | "HOSPITAL">("HOSPITAL");
  const [deptView, setDeptView] = useState<ActiveView>("active");

  // Technicians
  const [techs, setTechs] = useState<any[]>([]);
  const [techDepts, setTechDepts] = useState<{ id: string; name: string }[]>([]);
  const [newTech, setNewTech] = useState<any>({
    name: "",
    password: "",
    techDepartmentId: "",
    permissions: [],
  });
  const [techView, setTechView] = useState<ActiveView>("active");
  const [statusView, setStatusView] = useState<ActiveView>("active");

  const deptActiveFlag = deptView === "active";  // ✅ פעיל => true
  const techActiveFlag = techView === "active";  // ✅ פעיל => true
  const statusActiveFlag = statusView === "active";


  // Search
  const [deptSearch, setDeptSearch] = useState("");
  const [techSearch, setTechSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  // Search + navigation
  const [globalSearch, setGlobalSearch] = useState("");
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);


  // For "active/inactive" lookup while searching
  const [departmentsAll, setDepartmentsAll] = useState<any[]>([]);
  const [techsAll, setTechsAll] = useState<any[]>([]);

  const canCreateTech =
    String(newTech.name ?? "").trim().length >= 2 &&
    String(newTech.username ?? "").trim().length >= 2 &&
    String(newTech.password ?? "").length >= 6 &&
    String(newTech.techDepartmentId ?? "").trim().length > 0;



  const [permDraft, setPermDraft] = useState<Record<string, Permission[]>>({});
  const [permDirty, setPermDirty] = useState<Record<string, boolean>>({});

  // Ticket statuses
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusDraft, setStatusDraft] = useState<Record<string, any>>({});
  const [statusDirty, setStatusDirty] = useState<Record<string, boolean>>({});

  const [newStatus, setNewStatus] = useState<any>({
    key: "",
    labelHe: "",
    color: "#3B82F6",
    sortOrder: 0,
    isActive: true,
    isDefault: false,
  });

  const canCreateStatus =
    String(newStatus.key ?? "").trim().length > 0 &&
    String(newStatus.labelHe ?? "").trim().length > 0 &&
    String(newStatus.color ?? "").trim().length > 0 &&
    !isNaN(Number(newStatus.sortOrder)) && Number(newStatus.sortOrder) >= 0;




  const refreshDepartments = async () => {
    if (!canDept) return;
    const d = await listDepartments({ active: deptActiveFlag });
    setDepartments((d ?? []).map((x: any) => ({ ...x, __active: deptActiveFlag })));
    const [activeList, inactiveList] = await Promise.all([
      listDepartments({ active: true }),
      listDepartments({ active: false }),
    ]);

    setDepartmentsAll([
      ...((activeList ?? []).map((x: any) => ({ ...x, __active: true })) as any[]),
      ...((inactiveList ?? []).map((x: any) => ({ ...x, __active: false })) as any[]),
    ]);
  };

  const refreshTechs = async () => {
    if (!canTech) return;

    const list = await listTechnicians({ active: techActiveFlag }); // ✅ לא deptActiveFlag
    setTechs((list ?? []).map((x: any) => ({ ...x, __active: techActiveFlag })));
    const [activeList, inactiveList] = await Promise.all([
      listTechnicians({ active: true }),
      listTechnicians({ active: false }),
    ]);

    setTechsAll([
      ...((activeList ?? []).map((x: any) => ({ ...x, __active: true })) as any[]),
      ...((inactiveList ?? []).map((x: any) => ({ ...x, __active: false })) as any[]),
    ]);


    const init: Record<string, Permission[]> = {};
    for (const t of list ?? []) init[t.id] = (t.permissions ?? []).map((x: any) => x.perm);
    setPermDraft(init);
    setPermDirty({});

    const td = await listTechDepartments();
    setTechDepts((td ?? []).map((x: any) => ({ id: x.id, name: x.name })));
    console.log("TECH DEPTS API:", td);
  };



  const refreshStatuses = async () => {
    if (!canStatuses) return;
    const st = await listAdminTicketStatuses();
    setStatuses(st ?? []);

    const draft: Record<string, any> = {};
    (st ?? []).forEach((s: any) => (draft[s.id] = { ...s }));
    setStatusDraft(draft);
    setStatusDirty({});
  };

  const refreshAll = async () => {
    await Promise.all([refreshDepartments(), refreshTechs(), refreshStatuses()]);
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!me) return null;

  useEffect(() => {
    if (tab === "departments") refreshDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptView]);

  useEffect(() => {
    if (tab === "technicians") refreshTechs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techView]);

  useEffect(() => {
    if (tab === "technicians") {
      refreshTechs(); // בפנים חייב להביא גם tech departments
    }
  }, [tab]);


  // ===== Search helpers =====
  const isDeptActive = (d: any) => {
    if (typeof d?.__active === "boolean") return d.__active;
    return true;
  };

  const isTechActive = (t: any) => {
    if (typeof t?.__active === "boolean") return t.__active;
    return true;
  };

  // Per-tab filtered lists
  const deptQuery = deptSearch.trim().toLowerCase();
  const departmentsToRender = (deptQuery ? departmentsAll : departments)
    .filter((d) => d.type === (deptTab === "hospital" ? "HOSPITAL" : "TECH"))
    .filter((d) => (deptQuery ? String(d?.name ?? "").toLowerCase().includes(deptQuery) : true));

  const techQuery = techSearch.trim().toLowerCase();
  const techsToRender = (techQuery ? techsAll : techs).filter((t) => {
    if (!techQuery) return true;
    const name = String(t?.name ?? "").toLowerCase();
    const username = String(t?.username ?? "").toLowerCase();
    const deptName = String(t?.techDepartment?.name ?? "").toLowerCase();
    return name.includes(techQuery) || username.includes(techQuery) || deptName.includes(techQuery);
  });

  const statusQuery = statusSearch.trim().toLowerCase();
  const statusesToRender = (statuses ?? [])
    .filter((s) => {
      const d = statusDraft[s.id] ?? s;
      return statusActiveFlag ? Boolean(d.isActive) : !Boolean(d.isActive);
    })
    .filter((s) => {
      if (!statusQuery) return true;
      const d = statusDraft[s.id] ?? s;
      const key = String(d?.key ?? "").toLowerCase();
      const labelHe = String(d?.labelHe ?? "").toLowerCase();
      return key.includes(statusQuery) || labelHe.includes(statusQuery);
    });

  // Global search that navigates to the correct tab + active/inactive view and scrolls to the item
  const navigateSearch = async (raw: string) => {
    const q = raw.trim().toLowerCase();
    if (!q) return;

    // ensure "all lists" loaded for routing
    if (departmentsAll.length === 0 || techsAll.length === 0) {
      await Promise.all([refreshDepartments(), refreshTechs()]);
    }

    const dept = (departmentsAll ?? []).find((d) => String(d?.name ?? "").toLowerCase().includes(q));
    if (dept) {
      const active = isDeptActive(dept);
      setTab("departments");
      setDeptTab(dept.type === "TECH" ? "tech" : "hospital");
      setDeptView(active ? "active" : "archived");
      setDeptSearch(raw);
      setPendingScrollId(`dept-${dept.id}`);
      return;
    }

    const tech = (techsAll ?? []).find((t) => {
      const name = String(t?.name ?? "").toLowerCase();
      const username = String(t?.username ?? "").toLowerCase();
      const deptName = String(t?.techDepartment?.name ?? "").toLowerCase();
      return name.includes(q) || username.includes(q) || deptName.includes(q);
    });
    if (tech) {
      const active = isTechActive(tech);
      setTab("technicians");
      setTechView(active ? "active" : "archived");
      setTechSearch(raw);
      setPendingScrollId(`tech-${tech.id}`);
      return;
    }

    if ((statuses ?? []).length === 0) await refreshStatuses();

    const st = (statuses ?? []).find((s) => {
      const d = statusDraft?.[s.id] ?? s;
      const key = String(d?.key ?? "").toLowerCase();
      const labelHe = String(d?.labelHe ?? "").toLowerCase();
      return key.includes(q) || labelHe.includes(q);
    });
    if (st) {
      setTab("ticket-statuses");
      setStatusSearch(raw);
      setPendingScrollId(`status-${st.id}`);
      return;
    }

    toast({ title: "לא נמצאה תוצאה" });
  };

  useEffect(() => {
    if (!pendingScrollId) return;

    const t = setTimeout(() => {
      const el = document.getElementById(pendingScrollId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      setPendingScrollId(null);
    }, 60);

    return () => clearTimeout(t);
  }, [pendingScrollId, tab, deptView, techView, deptTab, departments, techs, statuses]);



  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">ניהול</h1>
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="חיפוש מהיר: מחלקה / טכנאי / סטטוס… (Enter)"
            onKeyDown={(e) => {
              if (e.key === "Enter") navigateSearch(globalSearch);
            }}
          />
          <Button onClick={() => navigateSearch(globalSearch)}>חפש</Button>
        </div>

        <Tabs className="flex justify-end" value={tab} onValueChange={(v) => setTab(v as AdminTab)}>
          <TabsList>
            <TabsTrigger value="ticket-statuses" disabled={!canStatuses}>סטטוסי קריאות</TabsTrigger>
            <TabsTrigger value="technicians" disabled={!canTech}>טכנאים</TabsTrigger>
            <TabsTrigger value="departments" disabled={!canDept}>מחלקות</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ================= DEPARTMENTS ================= */}
        {tab === "departments" && (
          !canDept ? (
            <Card><CardContent className="p-6">אין הרשאות לניהול מחלקות</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              <Card>
                <CardHeader><CardTitle>צור מחלקה</CardTitle></CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-3">
                  <Input
                    placeholder="שם מחלקה"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                  />
                  <select
                    className="border rounded-md p-2 bg-background"
                    value={newDeptType}
                    onChange={(e) => setNewDeptType(e.target.value as any)}
                  >
                    <option value="HOSPITAL">בית חולים</option>
                    <option value="TECH">טכנאים</option>
                  </select>

                  <Button
                    onClick={async () => {
                      try {
                        if (!newDeptName.trim()) return;
                        await createDepartment({ name: newDeptName.trim(), type: newDeptType });
                        setNewDeptName("");
                        await refreshDepartments();
                        toast({ title: "מחלקה נוצרה בהצלחה" });
                      } catch (e: any) {
                        toast({
                          title: "נכשל",
                          description: translateBackendError(e),
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    הוסף
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>מחלקות</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Input
                    placeholder="חיפוש מחלקה..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                  />


                  <div className="flex gap-2">
                    <Button
                      variant={deptTab === "hospital" ? "default" : "outline"}
                      onClick={() => setDeptTab("hospital")}
                    >
                      בית חולים
                    </Button>
                    <Button
                      variant={deptTab === "tech" ? "default" : "outline"}
                      onClick={() => setDeptTab("tech")}
                    >
                      טכנאים
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={deptView === "active" ? "default" : "outline"}
                      onClick={async () => {
                        setDeptView("active");
                      }}
                    >
                      פעיל
                    </Button>

                    <Button
                      variant={deptView === "archived" ? "default" : "outline"}
                      onClick={async () => {
                        setDeptView("archived");
                      }}
                    >
                      לא פעיל
                    </Button>
                  </div>


                  {deptQuery && departmentsToRender.length === 0 ? (
                    <div className="text-sm text-muted-foreground">לא נמצאו תוצאות</div>
                  ) : (
                    departmentsToRender.map((d) => (
                      <div id={`dept-${d.id}`} key={d.id} className="flex items-center gap-2 border rounded-md p-2">
                        <div className="flex-1">
                          <div className="font-medium">{d.name}</div>
                          <div className="text-xs opacity-70">{d.type}</div>
                          <span className={isDeptActive(d) ? "text-green-500" : "text-red-500"}>{isDeptActive(d) ? "פעיל" : "לא פעיל"}</span>

                        </div>

                        <Button
                          variant="outline"
                          onClick={async () => {
                            const name = prompt("New name", d.name);
                            if (!name) return;
                            try {
                              await patchDepartment(d.id, { name });
                              await refreshDepartments();
                            } catch (e: any) {
                              toast({
                                title: "נכשל",
                                description: translateBackendError(e),
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Rename
                        </Button>

                        {deptActiveFlag ? (
                          <Button
                            variant="destructive"
                            onClick={async () => {
                              if (!confirm("Disable department?")) return;
                              await disableDepartment(d.id);
                              await refreshDepartments();
                              await refreshTechs();
                            }}
                          >
                            השבת
                          </Button>
                        ) : (
                          <Button
                            onClick={async () => {
                              await enableDepartment(d.id);
                              await refreshDepartments();
                              await refreshTechs(); // כי ייתכן וטכנאים במחלקה הזו לא פעילים
                            }}
                          >
                            הפעל
                          </Button>
                        )}


                      </div>
                    )))}
                </CardContent>
              </Card>
            </div>
          )
        )}
        {/* ================= TECHNICIANS ================= */}
        {tab === "technicians" && (
          !canTech ? (
            <Card><CardContent className="p-6">אין הרשאות לניהול טכנאים</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {/* CREATE TECH */}
              <Card>
                <CardHeader><CardTitle>צור טכנאי</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="שם"
                    value={newTech.name}
                    onChange={(e) => setNewTech({ ...newTech, name: e.target.value })}
                  />
                  <Input
                    placeholder="שם משתמש"
                    value={newTech.username}
                    onChange={(e) => setNewTech({ ...newTech, username: e.target.value })}
                  />
                  <Input
                    placeholder="סיסמה"
                    type="password"
                    value={newTech.password}
                    onChange={(e) => setNewTech({ ...newTech, password: e.target.value })}
                  />

                  <select
                    className="border rounded-md p-2 bg-background"
                    value={newTech.techDepartmentId}
                    onChange={(e) => setNewTech({ ...newTech, techDepartmentId: e.target.value })}
                  >
                    <option value="">בחר מחלקה</option>
                    {techDepts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>

                  <div className="md:col-span-4 border rounded-md p-3 space-y-2">
                    <div className="text-sm font-medium">הרשאות</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {PERMS.map((p) => {
                        const current: Permission[] = newTech.permissions ?? [];
                        const checked = current.includes(p.key);



                        return (
                          <label key={p.key} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                const next = v
                                  ? Array.from(new Set([...current, p.key]))
                                  : current.filter((x) => x !== p.key);

                                setNewTech({ ...newTech, permissions: next });
                              }}
                            />
                            {p.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    className="md:col-span-4"
                    disabled={!canCreateTech}
                    onClick={async () => {
                      try {
                        const techDepartmentId = String(newTech.techDepartmentId ?? "").trim();

                        if (!techDepartmentId) {
                          toast({
                            title: "נכשל",
                            description: "חובה לבחור מחלקה",
                            variant: "destructive",
                          });
                          return;
                        }

                        await createTechnician({
                          name: String(newTech.name ?? "").trim(),
                          username: String(newTech.username ?? "").trim(),
                          password: String(newTech.password ?? ""),
                          techDepartmentId, // ✅ כבר בדקת שהוא לא ריק
                          permissions: newTech.permissions ?? [],
                        });

                        setNewTech({ name: "", username: "", password: "", techDepartmentId: "", permissions: [] });
                        await refreshTechs();
                        toast({ title: "טכנאי נוצר בהצלחה" });
                      } catch (e: any) {
                        const data = e?.response?.data;
                        const raw = data?.error ?? data?.message ?? e?.message ?? "פעולה נכשלה";

                        const fieldErrors = data?.details?.fieldErrors;
                        const niceDetails =
                          fieldErrors
                            ? Object.entries(fieldErrors)
                              .filter(([, arr]) => Array.isArray(arr) && arr.length)
                              .map(([k, arr]) => `${k}: ${(arr as string[])[0]}`)
                              .join(" | ")
                            : null;

                        toast({
                          title: "נכשל",
                          description: niceDetails
                            ? translateBackendError(niceDetails)
                            : translateBackendError(e),
                          variant: "destructive",
                        });
                      }
                    }}

                  >
                    הוסף טכנאי
                  </Button>
                  {!canCreateTech && (
                    <div className="flex text-xs text-muted-foreground text-center">
                      יש למלא שם, שם משתמש, סיסמה ולבחור מחלקה
                    </div>
                  )}

                </CardContent>
              </Card>

              {/* LIST TECHS */}
              <Card>
                <CardHeader><CardTitle>רשימת טכנאים</CardTitle></CardHeader>


                <CardContent className="space-y-2">
                  <Input
                    placeholder="חיפוש טכנאי (שם / שם משתמש / מחלקה)..."
                    value={techSearch}
                    onChange={(e) => setTechSearch(e.target.value)}
                  />

                  <div className="flex gap-2">
                    <Button
                      variant={techView === "active" ? "default" : "outline"}
                      onClick={() => setTechView("active")}
                    >
                      פעיל
                    </Button>

                    <Button
                      variant={techView === "archived" ? "default" : "outline"}
                      onClick={() => setTechView("archived")}
                    >
                      לא פעיל
                    </Button>
                  </div>


                  {techQuery && techsToRender.length === 0 ? (
                    <div className="text-sm text-muted-foreground">לא נמצאו תוצאות</div>
                  ) : (techsToRender.map((t) => {
                    const dirty = Boolean(permDirty[t.id]);

                    return (
                      <div id={`tech-${t.id}`} key={t.id} className="border rounded-md p-3 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start gap-3">
                          {/* details */}
                          <div className="flex-1">
                            <div className="font-medium">
                              {t.name}
                            </div>
                            <div className="text-xs opacity-70">
                              מחלקה: {t.techDepartment?.name ?? t.techDepartmentId ?? "-"}
                            </div>
                            <span className={isTechActive(t) ? "text-green-500" : "text-red-500"}>
                              {isTechActive(t) ? "פעיל" : "לא פעיל"}
                            </span>
                          </div>

                          {/* actions */}
                          <div className="flex flex-row gap-2 ">
                            {/* rename */}
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={async () => {
                                const name = prompt("New name", t.name);
                                if (!name) return;
                                try {
                                  await patchTechnician(t.id, { name });
                                  await refreshTechs();
                                } catch (e: any) {
                                  toast({
                                    title: "נכשל",
                                    description: translateBackendError(e),
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              שנה שם
                            </Button>

                            {/* delete / save / cancel in one column */}
                            {techActiveFlag ? (
                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={async () => {
                                  if (!confirm("Disable technician?")) return;
                                  await disableTechnician(t.id);
                                  await refreshTechs();
                                  await refreshDepartments();
                                }}
                              >
                                השבת
                              </Button>
                            ) : (
                              <Button
                                className="w-full"
                                onClick={async () => {
                                  await enableTechnician(t.id);
                                  await refreshTechs();
                                  await refreshDepartments(); // כי ייתכן והמחלקה שלו לא פעילה
                                }}
                              >
                                הפעל
                              </Button>
                            )}



                            {/* </div> */}

                            {/* <div className="flex grid md:grid-row-4 gap-2 "> */}
                            <Button
                              className={`w-full text-white ${dirty ? "bg-green-600 hover:bg-green-700" : "bg-green-300 cursor-not-allowed"}`}
                              disabled={!dirty}
                              onClick={async () => {
                                try {
                                  await patchTechnician(t.id, { permissions: permDraft[t.id] ?? [] });
                                  await refreshTechs();
                                  toast({ title: "הרשאות נשמרו בהצלחה" });
                                } catch (e: any) {
                                  toast({
                                    title: "נכשל",
                                    description: translateBackendError(e),
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              שמור
                            </Button>

                            <Button
                              variant="outline"
                              className="w-full"
                              disabled={!dirty}
                              onClick={() => {
                                const original = (t.permissions ?? []).map((x: any) => x.perm);
                                setPermDraft((prev) => ({ ...prev, [t.id]: original }));
                                setPermDirty((prev) => ({ ...prev, [t.id]: false }));
                              }}
                            >
                              ביטול
                            </Button>
                          </div>
                        </div>

                        {/* perms grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {PERMS.map((p) => {
                            const draftPerms = permDraft[t.id] ?? [];
                            const checked = draftPerms.includes(p.key);

                            return (
                              <label key={p.key} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const next = v
                                      ? Array.from(new Set([...draftPerms, p.key]))
                                      : draftPerms.filter((x) => x !== p.key);

                                    setPermDraft((prev) => ({ ...prev, [t.id]: next }));
                                    setPermDirty((prev) => ({ ...prev, [t.id]: true }));
                                  }}
                                />
                                {p.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }))}
                </CardContent>
              </Card>
            </div>
          )
        )}

        {/* ================= TICKET STATUSES ================= */}
        {tab === "ticket-statuses" && (
          !canStatuses ? (
            <Card><CardContent className="p-6">אין הרשאות לניהול סטטוסים</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              <Card>
                <CardHeader><CardTitle>צור סטטוס קריאה</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_2fr_2fr_1fr_auto] gap-3">
                  
                  <div className="flex flex-col gap-1">
  <label className="text-xs text-muted-foreground">ID</label>
  <Input
    type="number"
    placeholder="ID"
    value={String(newStatus.sortOrder ?? 0)}
    onChange={(e) => setNewStatus({ ...newStatus, sortOrder: Number(e.target.value) })}
  />
</div>

                  <div className="flex flex-col gap-1">
  <label className="text-xs text-muted-foreground">מפתח (KEY)</label>
  <Input
    placeholder="מפתח (KEY)"
    value={newStatus.key}
    onChange={(e) => setNewStatus({ ...newStatus, key: e.target.value.toUpperCase() })}
  />
</div>

                  <div className="flex flex-col gap-1">
  <label className="text-xs text-muted-foreground">שם בעברית</label>
  <Input
    placeholder="שם בעברית"
    value={newStatus.labelHe}
    onChange={(e) => setNewStatus({ ...newStatus, labelHe: e.target.value })}
  />
</div>

                 <div className="flex flex-col gap-1">
  <label className="text-xs text-muted-foreground">צבע</label>
  <Input
    type="color"
    value={newStatus.color || "#3B82F6"}
    onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
    className="h-10 p-1"
  />
</div>

                 <div className="flex flex-col gap-1 w-fit">
  <label className="text-xs text-muted-foreground">ברירת מחדל</label>

  <div className="h-10 flex items-center">
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={Boolean(newStatus.isDefault)}
        onCheckedChange={(v) => setNewStatus({ ...newStatus, isDefault: Boolean(v) })}
      />
      כן
    </label>
  </div>
</div>


                  <Button
                    className={`md:col-span-6 ${!canCreateStatus ? "bg-blue-300 cursor-not-allowed" : ""}`}
                    disabled={!canCreateStatus}
                    onClick={async () => {
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

                        setNewStatus({ key: "", labelHe: "", color: "#3B82F6", sortOrder: 0, isActive: true, isDefault: false });
                        await refreshStatuses();
                        toast({ title: "סטטוס נוצר בהצלחה" });
                      } catch (e: any) {
                        toast({
                          title: "נכשל",
                          description: translateBackendError(e),
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    הוסף סטטוס
                  </Button>
                  {!canCreateStatus && (
                    <div className="flex text-xs text-muted-foreground text-center">
                      יש למלא Key, שם סטטוס, צבע ו-ID
                    </div>
                  )}

                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>כל סטטוסי הקריאות</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="חיפוש סטטוס (Key / שם בעברית)..."
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant={statusView === "active" ? "default" : "outline"}
                      onClick={() => setStatusView("active")}
                    >
                      פעיל
                    </Button>

                    <Button
                      variant={statusView === "archived" ? "default" : "outline"}
                      onClick={() => setStatusView("archived")}
                    >
                      לא פעיל
                    </Button>
                  </div>

                  {statusQuery && statusesToRender.length === 0 ? (
                    <div className="text-sm text-muted-foreground">לא נמצאו תוצאות</div>
                  ) : (statusesToRender.map((s) => {
                    const d = statusDraft[s.id] ?? s;
                    const dirty = Boolean(statusDirty[s.id]);

                    return (
                      <div id={`status-${s.id}`} key={s.id} className="border rounded-md p-3 space-y-3">

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_0.5fr_0.5fr_0.5fr_auto] gap-4 items-end">

                          {/* KEY */}
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Key</label>
                            <Input
                              value={String(d.key ?? "")}
                              onChange={(e) => {
                                const next = { ...d, key: e.target.value.toUpperCase() };
                                setStatusDraft((p) => ({ ...p, [s.id]: next }));
                                setStatusDirty((p) => ({ ...p, [s.id]: true }));
                              }}
                            />
                          </div>

                          {/* שם בעברית */}
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">שם סטטוס</label>
                            <Input
                              value={String(d.labelHe ?? "")}
                              onChange={(e) => {
                                const next = { ...d, labelHe: e.target.value };
                                setStatusDraft((p) => ({ ...p, [s.id]: next }));
                                setStatusDirty((p) => ({ ...p, [s.id]: true }));
                              }}
                            />
                          </div>

                          {/* צבע */}
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">צבע</label>
                            <Input
                              type="color"
                              value={String(d.color ?? "#6B7280")}
                              onChange={(e) => {
                                const next = { ...d, color: e.target.value };
                                setStatusDraft((p) => ({ ...p, [s.id]: next }));
                                setStatusDirty((p) => ({ ...p, [s.id]: true }));
                              }}
                              className="h-10 p-1"
                            />
                          </div>

                          {/* סדר */}
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">ID</label>
                            <Input
                              type="number"
                              value={String(d.sortOrder ?? 0)}
                              onChange={(e) => {
                                const next = { ...d, sortOrder: Number(e.target.value) };
                                setStatusDraft((p) => ({ ...p, [s.id]: next }));
                                setStatusDirty((p) => ({ ...p, [s.id]: true }));
                              }}
                            />
                          </div>

                          {/* ברירת מחדל */}
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">ברירת מחדל</label>
                            <div className="h-10 flex items-center">
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={Boolean(d.isDefault)}
                                onCheckedChange={(v) => {
                                  const next = { ...d, isDefault: Boolean(v) };
                                  setStatusDraft((p) => ({ ...p, [s.id]: next }));
                                  setStatusDirty((p) => ({ ...p, [s.id]: true }));
                                }}
                              />
                              כן
                            </label>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button disabled={!dirty} onClick={async () => {
                              try {
                                await patchAdminTicketStatus(s.id, {
                                  key: String(d.key ?? "").trim().toUpperCase(),
                                  labelHe: String(d.labelHe ?? "").trim(),
                                  color: String(d.color ?? "").trim() ? String(d.color).trim() : null, sortOrder: Number(d.sortOrder) || 0,
                                  isDefault: Boolean(d.isDefault),
                                });
                                await refreshStatuses();
                                toast({ title: "נשמר בהצלחה" });
                              } catch (e: any) {
                                toast({
                                  title: "נכשל",
                                  description: translateBackendError(e),
                                  variant: "destructive",
                                });
                              }
                            }} > שמור </Button>
                            <Button variant="outline" disabled={!dirty} onClick={() => {
                              setStatusDraft((p) => ({ ...p, [s.id]: { ...s } }));
                              setStatusDirty((p) => ({ ...p, [s.id]: false }));
                            }} > ביטול </Button>
                            {Boolean(d.isActive) ? (
                              <Button
                                variant="destructive"
                                disabled={Boolean(d.isDefault)}
                                title={d.isDefault ? "לא ניתן להשבית סטטוס ברירת מחדל" : undefined}
                                onClick={async () => {
                                  if (!confirm("Disable status?")) return;
                                  try {
                                    await disableAdminTicketStatus(s.id);
                                    await refreshStatuses();
                                  } catch (e: any) {
                                    toast({ title: "נכשל", description: translateBackendError(e), variant: "destructive" });
                                  }
                                }}
                              >
                                השבת
                              </Button>
                            ) : (
                              <Button
                                onClick={async () => {
                                  try {
                                    await enableAdminTicketStatus(s.id);
                                    await refreshStatuses();
                                  } catch (e: any) {
                                    toast({ title: "נכשל", description: translateBackendError(e), variant: "destructive" });
                                  }
                                }}
                              >
                                הפעל
                              </Button>
                            )}

                          </div>
                        </div>
                      </div>
                    );
                  }))}
                </CardContent>
              </Card>
            </div>
          )
        )}
      </div>
    </MainLayout >
  );
}
