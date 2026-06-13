import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const copyCard = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/copy-card", data) as Promise<ReturnType>;
