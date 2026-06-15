import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createPipelineStage = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-pipeline-stage", data);
