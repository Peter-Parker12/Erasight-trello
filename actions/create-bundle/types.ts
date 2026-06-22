import { z } from "zod";
import { ProductBundle } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { CreateBundle } from "./schema";

export type InputType = z.infer<typeof CreateBundle>;
export type ReturnType = ActionState<InputType, ProductBundle>;
