import { Board } from "@prisma/client";

import { BoardTitleForm } from "./board-title-form";
import { BoardOptions } from "./board-options";
import { BoardMembers } from "./board-members";

type BoardNavbarProps = {
  data: Board;
  isAdmin: boolean;
};

export const BoardNavbar = async ({ data, isAdmin }: BoardNavbarProps) => {
  return (
    <div className="w-full h-14 z-[40] bg-black/50 fixed top-14 flex items-center px-6 gap-x-4 text-white">
      <BoardTitleForm data={data} />

      <div className="ml-auto flex items-center gap-x-2">
        {isAdmin && <BoardMembers boardId={data.id} />}
        <BoardOptions id={data.id} />
      </div>
    </div>
  );
};
