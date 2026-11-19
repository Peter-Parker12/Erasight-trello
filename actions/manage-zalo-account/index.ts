import { callApiAction } from "@/lib/fetch-action";
import type { UpdateInputType, UpdateReturnType, RemoveInputType, RemoveReturnType } from "./types";

export const updateZaloAccount = (data: UpdateInputType): Promise<UpdateReturnType> =>
  callApiAction("/api/actions/manage-zalo-account/update", data);

export const removeZaloAccount = (data: RemoveInputType): Promise<RemoveReturnType> =>
  callApiAction("/api/actions/manage-zalo-account/remove", data);
