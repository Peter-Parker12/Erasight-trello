import { Suspense } from "react";
import { Board } from "@prisma/client";

import { BoardTitleForm } from "./board-title-form";
import { BoardOptions } from "./board-options";
import { BoardMembers } from "./board-members";
import { TelegramSettings } from "./telegram-settings";
import { ViewToggle } from "./view-toggle";
import { BoardBackgroundPicker } from "./board-background-picker";
import { BoardSettingsSheet } from "./board-settings-sheet";
import { db } from "@/lib/db";

type BoardNavbarProps = {
  data: Board;
  isAdmin: boolean;
};

export const BoardNavbar = async ({ data, isAdmin }: BoardNavbarProps) => {
  const lists = isAdmin
    ? await db.list.findMany({
        where: { boardId: data.id },
        select: { id: true, title: true, order: true },
        orderBy: { order: "asc" },
      })
    : [];

  return (
    <div className="w-full h-14 z-[40] bg-black/50 fixed top-14 flex items-center px-3 sm:px-6 gap-x-2 sm:gap-x-4 text-white">
      <div className="min-w-0 shrink">
        <BoardTitleForm data={data} />
      </div>

      <div className="ml-auto flex items-center gap-x-1 sm:gap-x-2 overflow-x-auto">
        <Suspense><ViewToggle /></Suspense>
        <BoardBackgroundPicker boardId={data.id} />
        {isAdmin && <BoardMembers boardId={data.id} />}
        {isAdmin && <TelegramSettings boardId={data.id} />}
        {isAdmin && <BoardSettingsSheet boardId={data.id} lists={lists} />}
        <BoardOptions id={data.id} />
      </div>
    </div>
  );
};
