import { useQuery } from "@tanstack/react-query";
import { listTicketStatuses } from "@/api/meta";

export function useTicketStatuses() {
  return useQuery({
    queryKey: ["meta-ticket-statuses"],
    queryFn: () => listTicketStatuses(),
    staleTime: 1000 * 60 * 10,
  });
}
