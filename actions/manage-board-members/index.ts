import { callApiAction } from "@/lib/fetch-action";
import type { AddInputType, AddReturnType, RemoveInputType, RemoveReturnType } from "./types";

export const addBoardMember = (data: AddInputType): Promise<AddReturnType> =>
  callApiAction("/api/actions/manage-board-members/add", data);

export const removeBoardMember = (data: RemoveInputType): Promise<RemoveReturnType> =>
  callApiAction("/api/actions/manage-board-members/remove", data);
