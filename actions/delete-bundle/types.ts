import { z } from "zod";
import { ProductBundle } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteBundle } from "./schema";

export type InputType = z.infer<typeof DeleteBundle>;
export type ReturnType = ActionState<InputType, ProductBundle>;
