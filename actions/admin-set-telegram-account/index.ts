import { callApiAction } from "@/lib/fetch-action";
import type { InputType, ReturnType } from "./types";

export const adminSetTelegramAccount = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/admin-set-telegram-account", data);
