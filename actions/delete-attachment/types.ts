import { z } from "zod";
import { Attachment } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteAttachment } from "./schema";

export type InputType = z.infer<typeof DeleteAttachment>;
export type ReturnType = ActionState<InputType, Attachment>;
