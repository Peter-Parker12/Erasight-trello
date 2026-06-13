import { callApiAction } from "@/lib/fetch-action";
import type { UpdateInputType, UpdateReturnType, RemoveInputType, RemoveReturnType } from "./types";

export const updateDisplayName = (data: UpdateInputType): Promise<UpdateReturnType> =>
  callApiAction("/api/actions/manage-display-name/update", data);

export const removeDisplayName = (data: RemoveInputType): Promise<RemoveReturnType> =>
  callApiAction("/api/actions/manage-display-name/remove", data);
