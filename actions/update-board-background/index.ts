import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateBoardBackground = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-board-background", data);
