import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createCard = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-card", data) as Promise<ReturnType>;
