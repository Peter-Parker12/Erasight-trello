"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { deleteBoard } from "@/actions/delete-board";
import { useAction } from "@/hooks/use-action";
import { ImportCardsDialog } from "./import-cards-dialog";

type List = { id: string; title: string };

type BoardOptionsProps = {
  id: string;
  lists?: List[];
};

export const BoardOptions = ({ id, lists = [] }: BoardOptionsProps) => {
  const router = useRouter();
  const { orgId } = useAuth();
  const [importOpen, setImportOpen] = useState(false);

  const { execute, isLoading } = useAction(deleteBoard, {
    skipRefresh: true,
    onSuccess: () => {
      if (orgId) router.push(`/organization/${orgId}`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onDelete = () => {
    execute({ id });
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button className="h-auto w-auto p-2" variant="transparent">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="px-0 pt-3 pb-3" side="bottom" align="start">
          <div className="text-sm font-medium text-center text-[#e5e5e5]">
            Board actions
          </div>
          <PopoverClose asChild>
            <Button
              className="h-auto w-auto p-2 absolute top-2 right-2 text-[#e5e5e5]"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </PopoverClose>

          {lists.length > 0 && (
            <PopoverClose asChild>
              <Button
                variant="ghost"
                onClick={() => setImportOpen(true)}
                className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import cards
              </Button>
            </PopoverClose>
          )}

          <Button
            variant="ghost"
            onClick={onDelete}
            disabled={isLoading}
            aria-disabled={isLoading}
            className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
          >
            Delete this board
          </Button>
        </PopoverContent>
      </Popover>

      <ImportCardsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        boardId={id}
        lists={lists}
      />
    </>
  );
};
