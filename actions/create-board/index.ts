import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createBoard = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-board", data);
