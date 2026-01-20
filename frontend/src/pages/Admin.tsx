import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { hasAnyPermission, useAuth } from "@/context/AuthContext";
import { listDepartments, createDepartment, deleteDepartment, patchDepartment, listTechnicians, createTechnician, patchTechnician, deleteTechnician } from "@/api/admin";
import type { Permission } from "@/api/auth";
import { listTechDepartments } from "@/api/departments";

const PERMS: { key: Permission; label: string }[] = [
  { key: "TICKET_DELETE", label: "Delete tickets" },
  { key: "TICKET_DUPLICATE", label: "Duplicate tickets" },
  { key: "TICKET_REASSIGN", label: "Reassign tickets" },
  { key: "TECH_MANAGE", label: "Manage technicians" },
  { key: "DEPT_MANAGE", label: "Manage departments" },
];

export default function Admin() {
  const { me } = useAuth();
  const { toast } = useToast();

  const canTech = hasAnyPermission(me, ["TECH_MANAGE"]);
  const canDept = hasAnyPermission(me, ["DEPT_MANAGE"]);

  const [departments, setDepartments] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptType, setNewDeptType] = useState<"TECH"|"HOSPITAL">("HOSPITAL");

  const [newTech, setNewTech] = useState({ email: "", name: "", password: "", techDepartmentId: "" });
  const [techDepts, setTechDepts] = useState<{id:string;name:string}[]>([]);

  const refresh = async () => {
    if (canDept) setDepartments(await listDepartments());
    if (canTech) {
      setTechs(await listTechnicians());
      const td = await listTechDepartments();
      setTechDepts(td.map((x) => ({ id: x.id, name: x.name })));
    }
  };

  useEffect(() => { refresh(); }, []);

  if (!me) return null;

  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <Tabs defaultValue="departments">
          <TabsList>
            <TabsTrigger value="departments" disabled={!canDept}>Departments</TabsTrigger>
            <TabsTrigger value="technicians" disabled={!canTech}>Technicians</TabsTrigger>
          </TabsList>

          <TabsContent value="departments">
            {!canDept ? (
              <Card><CardContent className="p-6">No permission.</CardContent></Card>
            ) : (
              <div className="grid gap-4">
                <Card>
                  <CardHeader><CardTitle>Create Department</CardTitle></CardHeader>
                  <CardContent className="flex flex-col md:flex-row gap-3">
                    <Input placeholder="Name" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} />
                    <select className="border rounded-md p-2 bg-background" value={newDeptType} onChange={(e)=>setNewDeptType(e.target.value as any)}>
                      <option value="HOSPITAL">Hospital</option>
                      <option value="TECH">Tech</option>
                    </select>
                    <Button onClick={async () => {
                      try {
                        if (!newDeptName.trim()) return;
                        await createDepartment({ name: newDeptName.trim(), type: newDeptType });
                        setNewDeptName("");
                        await refresh();
                        toast({ title: "Department created" });
                      } catch (e:any) {
                        toast({ title: "Failed", description: e?.response?.data?.message ?? e?.message, variant:"destructive" });
                      }
                    }}>Add</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>All Departments</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {departments.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 border rounded-md p-2">
                        <div className="flex-1">
                          <div className="font-medium">{d.name}</div>
                          <div className="text-xs opacity-70">{d.type}</div>
                        </div>
                        <Button variant="outline" onClick={async () => {
                          const name = prompt("New name", d.name);
                          if (!name) return;
                          try { await patchDepartment(d.id, { name }); await refresh(); } catch (e:any) {
                            toast({ title:"Failed", description: e?.response?.data?.message ?? e?.message, variant:"destructive" });
                          }
                        }}>Rename</Button>
                        <Button variant="destructive" onClick={async () => {
                          if (!confirm("Delete department?")) return;
                          try { await deleteDepartment(d.id); await refresh(); } catch (e:any) {
                            toast({ title:"Failed", description: e?.response?.data?.message ?? e?.message, variant:"destructive" });
                          }
                        }}>Delete</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="technicians">
            {!canTech ? (
              <Card><CardContent className="p-6">No permission.</CardContent></Card>
            ) : (
              <div className="grid gap-4">
                <Card>
                  <CardHeader><CardTitle>Create Technician</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input placeholder="Email" value={newTech.email} onChange={(e)=>setNewTech({...newTech,email:e.target.value})}/>
                    <Input placeholder="Name" value={newTech.name} onChange={(e)=>setNewTech({...newTech,name:e.target.value})}/>
                    <Input placeholder="Password" type="password" value={newTech.password} onChange={(e)=>setNewTech({...newTech,password:e.target.value})}/>
                    <select className="border rounded-md p-2 bg-background" value={newTech.techDepartmentId} onChange={(e)=>setNewTech({...newTech,techDepartmentId:e.target.value})}>
                      <option value="">(Tech department)</option>
                      {techDepts.map((d)=> <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>

                    <div className="md:col-span-4 border rounded-md p-3 space-y-2">
                      <div className="text-sm font-medium">Extra permissions</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {PERMS.map((p) => (
                          <label key={p.key} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={(newTech as any).permissions?.includes(p.key) ?? false}
                              onCheckedChange={(v) => {
                                const arr: Permission[] = (newTech as any).permissions ?? [];
                                const next = v ? Array.from(new Set([...arr, p.key])) : arr.filter((x) => x !== p.key);
                                setNewTech({ ...(newTech as any), permissions: next });
                              }}
                            />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button className="md:col-span-4" onClick={async () => {
                      try {
                        await createTechnician({
                          email: newTech.email.trim(),
                          name: newTech.name.trim(),
                          password: newTech.password,
                          techDepartmentId: newTech.techDepartmentId || null,
                          permissions: (newTech as any).permissions ?? [],
                        });
                        setNewTech({ email:"", name:"", password:"", techDepartmentId:"" } as any);
                        await refresh();
                        toast({ title: "Technician created" });
                      } catch (e:any) {
                        toast({ title:"Failed", description: e?.response?.data?.message ?? e?.message, variant:"destructive" });
                      }
                    }}>Add technician</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Technicians</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {techs.map((t) => (
                      <div key={t.id} className="border rounded-md p-3 space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <div className="flex-1">
                            <div className="font-medium">{t.name} <span className="opacity-70 text-sm">({t.email})</span></div>
                            <div className="text-xs opacity-70">Dept: {t.techDepartment?.name ?? t.techDepartmentId ?? "-"}</div>
                          </div>
                          <Button variant="outline" onClick={async () => {
                            const name = prompt("New name", t.name);
                            if (!name) return;
                            try { await patchTechnician(t.id, { name }); await refresh(); } catch(e:any){
                              toast({ title:"Failed", description: e?.response?.data?.message ?? e?.message, variant:"destructive" });
                            }
                          }}>Rename</Button>
                          <Button variant="destructive" onClick={async () => {
                            if (!confirm("Delete technician?")) return;
                            try { await deleteTechnician(t.id); await refresh(); } catch(e:any){
                              toast({ title:"Failed", description: e?.response?.data?.message ?? e?.message, variant:"destructive" });
                            }
                          }}>Delete</Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {PERMS.map((p) => {
                            const checked = (t.permissions ?? []).some((x:any)=>x.perm===p.key);
                            return (
                              <label key={p.key} className="flex items-center gap-2 text-sm">
                                <Checkbox checked={checked} onCheckedChange={async (v) => {
                                  const current: Permission[] = (t.permissions ?? []).map((x:any)=>x.perm);
                                  const next = v ? Array.from(new Set([...current, p.key])) : current.filter((x)=>x!==p.key);
                                  try { await patchTechnician(t.id, { permissions: next }); await refresh(); } catch(e:any){
                                    toast({ title:"Failed", description: e?.response?.data?.message ?? e?.message, variant:"destructive" });
                                  }
                                }} />
                                {p.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
