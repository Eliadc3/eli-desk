import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminTab } from "../utils/adminConstants";

interface AdminHeaderProps {
  value: AdminTab;
  onValueChange: (value: AdminTab) => void;
  canStatuses: boolean;
  canTech: boolean;
  canDept: boolean;
  globalSearch: string;
  onGlobalSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
}

export function AdminHeader(props: AdminHeaderProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold">ניהול</h1>
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          value={props.globalSearch}
          onChange={(event) => props.onGlobalSearchChange(event.target.value)}
          placeholder="חיפוש מהיר: מחלקה / טכנאי / סטטוס… (Enter)"
          onKeyDown={(event) => {
            if (event.key === "Enter") props.onSearchSubmit();
          }}
        />
        <Button onClick={props.onSearchSubmit}>חפש</Button>
      </div>

      <Tabs className="flex justify-end" value={props.value} onValueChange={(value) => props.onValueChange(value as AdminTab)}>
        <TabsList>
          <TabsTrigger value="ticket-statuses" disabled={!props.canStatuses}>סטטוסי קריאות</TabsTrigger>
          <TabsTrigger value="technicians" disabled={!props.canTech}>טכנאים</TabsTrigger>
          <TabsTrigger value="departments" disabled={!props.canDept}>מחלקות</TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
}
