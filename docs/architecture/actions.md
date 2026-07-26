# Server actions

92 folders under `actions/`, each following the same file layout:

```
actions/<name>/
  schema.ts   Zod schema — the input contract
  types.ts    InputType (z.infer<schema>) + ReturnType (ActionState<InputType, TOutput>)
  index.ts    the function client/server code actually imports
```

Two conventions coexist for what `index.ts` does. **Check the first line of `index.ts` before adding to a folder** — `"use server"` means Pattern B, anything else (usually a `callApiAction` call) means Pattern A.

## Pattern A — API-route (majority, ~75/91 folders)

Used by Board/Kanban/CRM domains. `index.ts` is a thin client-safe wrapper; the real logic lives in a matching `app/api/actions/<name>/route.ts`.

**`actions/create-attachment/index.ts`**
```ts
import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createAttachment = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-attachment", data);
```

**`app/api/actions/create-attachment/route.ts`** — this is where auth, Prisma, and audit logging actually happen:
```ts
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { CreateAttachment } from "@/actions/create-attachment/schema";
import { InputType, ReturnType } from "@/actions/create-attachment/types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const card = await db.card.findUnique({
    where: { id: data.cardId },
    include: { list: { include: { board: true } } },
  });
  if (!card || card.list.board.orgId !== orgId) return { error: "Card not found" };

  const attachment = await db.attachment.create({ data: { cardId: data.cardId, name: data.name, url: data.url } });

  await createAuditLog({ entityId: attachment.id, entityType: ENTITY_TYPE.ATTACHMENT, entityTitle: data.name, action: ACTION.CREATE });
  revalidatePath(`/board/${data.boardId}`);
  return { data: attachment };
};

export const POST = toApiRoute(createSafeAction(CreateAttachment, handler));
```

`toApiRoute` (`lib/api-route.ts`) turns a `createSafeAction`-wrapped handler into a Next.js route handler: parses the JSON body, calls the action, returns it as `NextResponse.json(...)`, catches thrown errors as a 500. `callApiAction` (`lib/fetch-action.ts`) is the client-side mirror: POSTs JSON to that route and returns the parsed `ActionState`.

## Pattern B — direct server action (newer, ~16/91 folders)

Used by OKR/KPI/Department/Telegram-config domains. No separate route file — `index.ts` *is* the server action.

**`actions/create-okr-check-in/index.ts`**
```ts
"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { canManageDepartmentData } from "@/lib/okr-access";
import { computeObjectiveScore } from "@/lib/okr-score";
import { CreateOkrCheckIn } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const objective = await db.objective.findUnique({
    where: { id: data.objectiveId },
    include: { keyResults: true },
  });
  if (!objective || objective.orgId !== orgId) return { error: "Objective not found." };

  const allowed = await canManageDepartmentData(orgId, objective.departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  const user = await currentUser();
  const userName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Unknown";
  const score = computeObjectiveScore(objective.keyResults);

  const checkIn = await db.okrCheckIn.create({
    data: { objectiveId: data.objectiveId, userId, userName, note: data.note || null, scoreAtCheckIn: score ?? 0 },
  });

  revalidatePath(`/organization/${orgId}/dashboard/okrs`, "layout");
  return { data: checkIn };
};

export const createOkrCheckIn = createSafeAction(CreateOkrCheckIn, handler);
```

## Which pattern for a new action?

- Adding to an existing domain → match its siblings (grep the domain's other action folders for `"use server"` vs `callApiAction`).
- A genuinely new domain → default to **Pattern B**. It's one file instead of two, no route-file indirection, and is what every action added since the OKR/KPI/Dashboard work has used.

## Shared plumbing

**`lib/create-safe-action.ts`** — the core both patterns build on. Wraps a handler with Zod validation and returns a uniform shape:
```ts
export type ActionState<TInput, TOutput> = {
  fieldErrors?: FieldErrors<TInput>;
  error?: string | null;
  data?: TOutput;
};

export const createSafeAction = <TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (validatedData: TInput) => Promise<ActionState<TInput, TOutput>>
) => async (data: TInput): Promise<ActionState<TInput, TOutput>> => {
  const validationResult = schema.safeParse(data);
  if (!validationResult.success) {
    return { fieldErrors: validationResult.error.flatten().fieldErrors as FieldErrors<TInput> };
  }
  return handler(validationResult.data);
};
```

**`hooks/use-action.ts`** (`useAction`) — the client-side consumer, identical regardless of which pattern is underneath since both resolve to `Promise<ActionState<...>>`:
```ts
const { execute, isLoading, error, fieldErrors, data } = useAction(createAttachment, {
  onSuccess: (data) => toast.success("Attached"),
  onError: (error) => toast.error(error),
  skipRefresh: false, // default: calls router.refresh() on success
});
```
