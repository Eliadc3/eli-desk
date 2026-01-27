import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Agent {
  id: string;
  name: string;
  initials: string;
  openTickets: number;
  resolvedToday: number;
  capacity: number;
}


export function AgentWorkload({ agents }: { agents?: Agent[] }) {
  const list = agents || [];

  return (
    <div className="bg-card rounded-lg p-5 border border-border shadow-card">
      <h3 className="text-base font-semibold text-foreground mb-4">
        עומס טכנאים
      </h3>
      <div className="space-y-4">
        {list.map((agent) => {
          const workloadPercent = (agent.openTickets / agent.capacity) * 100;
          const isOverloaded = workloadPercent > 80;

          return (
            <div key={agent.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {agent.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {agent.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {agent.openTickets} פתוחות · {agent.resolvedToday} נפתרו היום
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    isOverloaded ? "text-red-500" : "text-muted-foreground"
                  }`}
                >
                  {agent.openTickets}/{agent.capacity}
                </span>
              </div>
              <Progress
                value={workloadPercent}
                className={`h-2 ${isOverloaded ? "[&>div]:bg-red-500" : ""}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
