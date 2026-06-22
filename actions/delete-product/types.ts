import { z } from "zod";
import { Product } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteProduct } from "./schema";

export type InputType = z.infer<typeof DeleteProduct>;
export type ReturnType = ActionState<InputType, Product>;
