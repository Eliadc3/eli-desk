import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ActiveView, DeptSubTab } from "../utils/adminConstants";

interface DepartmentsSectionProps {
  canDept: boolean;
  newDeptName: string;
  newDeptType: "TECH" | "HOSPITAL";
  onNewDeptNameChange: (value: string) => void;
  onNewDeptTypeChange: (value: "TECH" | "HOSPITAL") => void;
  onCreate: () => void;
  deptSearch: string;
  onDeptSearchChange: (value: string) => void;
  deptTab: DeptSubTab;
  onDeptTabChange: (value: DeptSubTab) => void;
  deptView: ActiveView;
  onDeptViewChange: (value: ActiveView) => void;
  deptQuery: string;
  departmentsToRender: any[];
  isDeptActive: (department: any) => boolean;
  deptActiveFlag: boolean;
  onRename: (department: any) => void;
  onDisable: (departmentId: string) => void;
  onEnable: (departmentId: string) => void;
  onDeletePermanent: (departmentId: string) => void;
}

export function DepartmentsSection(props: DepartmentsSectionProps) {
  if (!props.canDept) {
    return (
      <Card>
        <CardContent className="p-6">אין הרשאות לניהול מחלקות</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>צור מחלקה</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <Input placeholder="שם מחלקה" value={props.newDeptName} onChange={(e) => props.onNewDeptNameChange(e.target.value)} />
          <select className="border rounded-md p-2 bg-background" value={props.newDeptType} onChange={(e) => props.onNewDeptTypeChange(e.target.value as "TECH" | "HOSPITAL") }>
            <option value="HOSPITAL">בית חולים</option>
            <option value="TECH">טכנאים</option>
          </select>
          <Button onClick={props.onCreate}>הוסף</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>מחלקות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="חיפוש מחלקה..." value={props.deptSearch} onChange={(e) => props.onDeptSearchChange(e.target.value)} />

          <div className="flex gap-2">
            <Button variant={props.deptTab === "hospital" ? "default" : "outline"} onClick={() => props.onDeptTabChange("hospital")}>בית חולים</Button>
            <Button variant={props.deptTab === "tech" ? "default" : "outline"} onClick={() => props.onDeptTabChange("tech")}>טכנאים</Button>
          </div>

          <div className="flex gap-2">
            <Button variant={props.deptView === "active" ? "default" : "outline"} onClick={() => props.onDeptViewChange("active")}>פעיל</Button>
            <Button variant={props.deptView === "archived" ? "default" : "outline"} onClick={() => props.onDeptViewChange("archived")}>לא פעיל</Button>
          </div>

          {props.deptQuery && props.departmentsToRender.length === 0 ? (
            <div className="text-sm text-muted-foreground">לא נמצאו תוצאות</div>
          ) : (
            props.departmentsToRender.map((department) => (
              <div id={`dept-${department.id}`} key={department.id} className="flex items-center gap-2 border rounded-md p-2">
                <div className="flex-1">
                  <div className="font-medium">{department.name}</div>
                  <div className="text-xs opacity-70">{department.type}</div>
                  <span className={props.isDeptActive(department) ? "text-green-500" : "text-red-500"}>
                    {props.isDeptActive(department) ? "פעיל" : "לא פעיל"}
                  </span>
                </div>

                <Button variant="outline" onClick={() => props.onRename(department)}>Rename</Button>

                {props.deptActiveFlag ? (
                  <Button variant="destructive" onClick={() => props.onDisable(department.id)}>השבת</Button>
                ) : (
                  <>
                    <Button onClick={() => props.onEnable(department.id)}>הפעל</Button>
                    <Button variant="destructive" onClick={() => props.onDeletePermanent(department.id)}>מחק</Button>
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
