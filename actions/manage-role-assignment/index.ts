import { callApiAction } from "@/lib/fetch-action";
import type {
  AddInputType,
  AddReturnType,
  RemoveInputType,
  RemoveReturnType,
} from "./types";

export const assignRoleToUser = (data: AddInputType): Promise<AddReturnType> =>
  callApiAction("/api/actions/manage-role-assignment/add", data);

export const unassignRoleFromUser = (data: RemoveInputType): Promise<RemoveReturnType> =>
  callApiAction("/api/actions/manage-role-assignment/remove", data);
