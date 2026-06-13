import { callApiAction } from "@/lib/fetch-action";
import type { AddInputType, RemoveInputType, ReturnType } from "./types";

export const addCardMember = (data: AddInputType): Promise<ReturnType> =>
  callApiAction("/api/actions/manage-card-members/add", data);

export const removeCardMember = (data: RemoveInputType): Promise<ReturnType> =>
  callApiAction("/api/actions/manage-card-members/remove", data);
