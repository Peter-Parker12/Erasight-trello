import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createKbFolder = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-kb-folder", data);
