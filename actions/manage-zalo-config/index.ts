import { callApiAction } from "@/lib/fetch-action";
import type { UpdateInputType, UpdateReturnType, RemoveInputType, RemoveReturnType } from "./types";

export const updateZaloConfig = (data: UpdateInputType): Promise<UpdateReturnType> =>
  callApiAction("/api/actions/manage-zalo-config/update", data);

export const removeZaloConfig = (data: RemoveInputType): Promise<RemoveReturnType> =>
  callApiAction("/api/actions/manage-zalo-config/remove", data);
