import { Suspense } from "react";
import { Board } from "@prisma/client";

import { BoardTitleForm } from "./board-title-form";
import { BoardOptions } from "./board-options";
import { BoardMembers } from "./board-members";
import { TelegramSettings } from "./telegram-settings";
import { ViewToggle } from "./view-toggle";
import { BoardBackgroundPicker } from "./board-background-picker";

type BoardNavbarProps = {
  data: Board;
  isAdmin: boolean;
};

export const BoardNavbar = async ({ data, isAdmin }: BoardNavbarProps) => {
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
        <BoardOptions id={data.id} />
      </div>
    </div>
  );
};
