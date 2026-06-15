import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deletePipelineStage = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-pipeline-stage", data);
