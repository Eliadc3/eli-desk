import { api } from "./client"; // אותו import שיש לך בקבצי api אחרים

export async function listTicketStatuses() {
  const { data } = await api.get("/meta/ticket-statuses");
  return data.items as string[];
}


export async function listTicketPriorities() {
  const { data } = await api.get("/meta/ticket-priorities");
  return data.items as string[];
}
