import { MainLayout } from "@/components/layout/MainLayout";
import { AdminHeader } from "./components/AdminHeader";
import { DepartmentsSection } from "./components/DepartmentsSection";
import { StatusesSection } from "./components/StatusesSection";
import { TechniciansSection } from "./components/TechniciansSection";
import { useAdminPage } from "./hooks/useAdminPage";

export default function AdminPage() {
  const admin = useAdminPage();
  if (!admin.me) return null;

  return (
    <MainLayout>
      <div className="space-y-4">
        <AdminHeader
          value={admin.tab}
          onValueChange={admin.setTab}
          canStatuses={admin.canStatuses}
          canTech={admin.canTech}
          canDept={admin.canDept}
          globalSearch={admin.globalSearch}
          onGlobalSearchChange={admin.setGlobalSearch}
          onSearchSubmit={() => admin.navigateSearch(admin.globalSearch)}
        />

        {admin.tab === "departments" && (
          <DepartmentsSection
            canDept={admin.canDept}
            newDeptName={admin.newDeptName}
            newDeptType={admin.newDeptType}
            onNewDeptNameChange={admin.setNewDeptName}
            onNewDeptTypeChange={admin.setNewDeptType}
            onCreate={admin.createDepartmentHandler}
            deptSearch={admin.deptSearch}
            onDeptSearchChange={admin.setDeptSearch}
            deptTab={admin.deptTab}
            onDeptTabChange={admin.setDeptTab}
            deptView={admin.deptView}
            onDeptViewChange={admin.setDeptView}
            deptQuery={admin.deptQuery}
            departmentsToRender={admin.departmentsToRender}
            isDeptActive={admin.isDeptActive}
            deptActiveFlag={admin.deptActiveFlag}
            onRename={admin.renameDepartment}
            onDisable={admin.disableDepartmentHandler}
            onEnable={admin.enableDepartmentHandler}
            onDeletePermanent={admin.deleteDepartmentPermanently}
          />
        )}

        {admin.tab === "technicians" && (
          <TechniciansSection
            canTech={admin.canTech}
            newTech={admin.newTech}
            setNewTech={admin.setNewTech}
            techDepts={admin.techDepts}
            canCreateTech={admin.canCreateTech}
            onCreateTechnician={admin.createTechnicianHandler}
            techSearch={admin.techSearch}
            onTechSearchChange={admin.setTechSearch}
            techView={admin.techView}
            onTechViewChange={admin.setTechView}
            techQuery={admin.techQuery}
            techsToRender={admin.techsToRender}
            isTechActive={admin.isTechActive}
            techActiveFlag={admin.techActiveFlag}
            permDraft={admin.permDraft}
            setPermDraft={admin.setPermDraft}
            permDirty={admin.permDirty}
            setPermDirty={admin.setPermDirty}
            techDeptDraft={admin.techDeptDraft}
            setTechDeptDraft={admin.setTechDeptDraft}
            techDeptDirty={admin.techDeptDirty}
            setTechDeptDirty={admin.setTechDeptDirty}
            onRename={admin.renameTechnician}
            onDisable={admin.disableTechnicianHandler}
            onEnable={admin.enableTechnicianHandler}
            onDeletePermanent={admin.deleteTechnicianPermanently}
            onSave={admin.saveTechnicianChanges}
            onRollback={admin.rollbackTechnicianChanges}
          />
        )}

        {admin.tab === "ticket-statuses" && (
          <StatusesSection
            canStatuses={admin.canStatuses}
            newStatus={admin.newStatus}
            setNewStatus={admin.setNewStatus}
            canCreateStatus={admin.canCreateStatus}
            onCreateStatus={admin.createStatusHandler}
            statusSearch={admin.statusSearch}
            onStatusSearchChange={admin.setStatusSearch}
            statusView={admin.statusView}
            onStatusViewChange={admin.setStatusView}
            statusQuery={admin.statusQuery}
            statusesToRender={admin.statusesToRender}
            statusDraft={admin.statusDraft}
            statusDirty={admin.statusDirty}
            updateStatusField={admin.updateStatusField}
            saveStatusChanges={admin.saveStatusChanges}
            rollbackStatusChanges={admin.rollbackStatusChanges}
            disableStatusHandler={admin.disableStatusHandler}
            enableStatusHandler={admin.enableStatusHandler}
          />
        )}
      </div>
    </MainLayout>
  );
}
