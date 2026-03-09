import { MainLayout } from "@/components/layout/MainLayout";
import { TicketDetailHeader } from "./components/TicketDetailHeader";
import { TicketEditableSections } from "./components/TicketEditableSections";
import { TicketSidebarCard } from "./components/TicketSidebarCard";
import { useTicketDetail } from "./hooks/useTicketDetail";
import { priorityTone } from "./utils/ticketDetailHelpers";

export default function TicketDetailPage() {
  const detail = useTicketDetail();

  if (detail.ticketQ.isLoading) return <MainLayout><div>Loading...</div></MainLayout>;
  if (!detail.ticket) return <MainLayout><div>Not found</div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-5">
        <TicketDetailHeader
          ticket={detail.ticket}
          canEdit={detail.canEdit}
          canDuplicate={detail.canDuplicate}
          canDelete={detail.canDelete}
          draft={detail.draft}
          savePending={detail.saveMutation.isPending}
          headerStatusLabel={detail.headerStatusLabel}
          currentStatusKey={detail.currentStatusKey}
          headerStatusColor={detail.headerStatusColor}
          priorityBadgeClass={priorityTone(detail.ticket.priority)}
          onBack={() => detail.nav("/tickets")}
          onSave={detail.saveDraft}
          onCancel={detail.resetDraft}
          onDuplicate={detail.duplicateCurrentTicket}
          onPrint={detail.printLabel}
          onDelete={detail.deleteCurrentTicket}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TicketSidebarCard
            ticket={detail.ticket}
            draft={detail.draft}
            setDraft={detail.setDraft}
            canEdit={detail.canEdit}
            canReassign={detail.canReassign}
            statusesQ={detail.statusesQ}
            statuses={detail.statuses}
            headerStatusLabel={detail.headerStatusLabel}
            assignees={detail.assignees}
            currentAssigneeLabel={detail.currentAssigneeLabel}
            departments={detail.departmentsQ.data ?? []}
            departmentName={detail.departmentName}
          />
          <TicketEditableSections draft={detail.draft} setDraft={detail.setDraft} canEdit={detail.canEdit} showNotes={detail.me?.role !== "CUSTOMER"} />
        </div>
      </div>
    </MainLayout>
  );
}
