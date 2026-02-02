import { api } from "./client";

export type TicketStatusDto = {
  id: string;
  key: string;
  labelHe: string;
  color?: string | null;
  sortOrder: number;
  isDefault: boolean;
};

export async function listTicketStatuses() {
  const { data } = await api.get("/meta/ticket-statuses");
  return data.items as TicketStatusDto[];
}

export async function listTicketPriorities() {
  const { data } = await api.get("/meta/ticket-priorities");
  return data.items as string[];
}
