import { z } from "zod";
import { Department } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateDepartment } from "./schema";

export type InputType = z.infer<typeof UpdateDepartment>;
export type ReturnType = ActionState<InputType, Department>;
