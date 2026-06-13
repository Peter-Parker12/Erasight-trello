import { callApiAction } from "@/lib/fetch-action";
import type { UpdateInputType, UpdateReturnType, RemoveInputType, RemoveReturnType } from "./types";

export const updateTelegramAccount = (data: UpdateInputType): Promise<UpdateReturnType> =>
  callApiAction("/api/actions/manage-telegram-account/update", data);

export const removeTelegramAccount = (data: RemoveInputType): Promise<RemoveReturnType> =>
  callApiAction("/api/actions/manage-telegram-account/remove", data);
