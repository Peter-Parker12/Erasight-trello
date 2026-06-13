import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createLabel = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-label", data);
