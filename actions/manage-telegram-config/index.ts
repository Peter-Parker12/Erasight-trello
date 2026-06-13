import { callApiAction } from "@/lib/fetch-action";
import type { UpdateInputType, UpdateReturnType, RemoveInputType, RemoveReturnType } from "./types";

export const updateTelegramConfig = (data: UpdateInputType): Promise<UpdateReturnType> =>
  callApiAction("/api/actions/manage-telegram-config/update", data);

export const removeTelegramConfig = (data: RemoveInputType): Promise<RemoveReturnType> =>
  callApiAction("/api/actions/manage-telegram-config/remove", data);
