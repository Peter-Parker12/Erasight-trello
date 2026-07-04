import { z } from "zod";
import { Department } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { SeedOkrDefaults } from "./schema";

export type InputType = z.infer<typeof SeedOkrDefaults>;
export type ReturnType = ActionState<InputType, Department[]>;
