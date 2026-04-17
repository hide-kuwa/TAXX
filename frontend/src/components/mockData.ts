import { CLIENTS, PERIODS, RELATION_TYPE_LABEL, STAFFS, getClientGroups } from "@/config/organization";
import { Staff } from "./types";

const clientMap = new Map(CLIENTS.map((client) => [client.id, client]));

export const STAFF_DATA: Staff[] = STAFFS.map((staff) => ({
  id: staff.id,
  name: `${staff.name} (${staff.team})`,
  clients: staff.assignments
    .map((assignment) => {
      const client = clientMap.get(assignment.clientId);
      if (!client) return null;
      return {
        id: client.id,
        name: client.name,
        fiscal: client.fiscalMonth,
        role: assignment.assignmentRole,
        groupLabels: getClientGroups(client.id).map((group) => group.name),
        relationLabels: getClientGroups(client.id).map((group) => RELATION_TYPE_LABEL[group.relationType]),
      };
    })
    .filter((client): client is NonNullable<typeof client> => client !== null),
}));

export { PERIODS };
