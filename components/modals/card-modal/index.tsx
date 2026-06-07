"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { useCardModal } from "@/hooks/use-card-modal";
import { CardWithFullDetail } from "@/types";
import { fetcher } from "@/lib/fetcher";
import { AuditLog } from "@prisma/client";

import { Header } from "./header";
import { Description } from "./description";
import { Activity } from "./activity";
import { CardMeta } from "./card-meta";
import { Checklists } from "./checklists";
import { Comments } from "./comments";
import { Attachments } from "./attachments";
import { ActionsSidebar } from "./actions-sidebar";
import { TranslatePanel } from "./translate-panel";

export const CardModal = () => {
  const id = useCardModal((state) => state.id);
  const isOpen = useCardModal((state) => state.isOpen);
  const onClose = useCardModal((state) => state.onClose);

  const { data: cardData } = useQuery<CardWithFullDetail>({
    queryKey: ["card", id],
    queryFn: () => fetcher(`/api/cards/${id}`),
    enabled: !!id,
  });

  const { data: auditLogsData } = useQuery<AuditLog[]>({
    queryKey: ["card-logs", id],
    queryFn: () => fetcher(`/api/cards/${id}/logs`),
    enabled: !!id,
  });

  const coverColor = cardData?.coverColor;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        {/* Cover color stripe */}
        {coverColor && (
          <div className="h-10 w-full rounded-t-lg" style={{ backgroundColor: coverColor }} />
        )}

        <div className="px-6 pb-6 pt-4">
          {cardData ? <Header data={cardData} /> : <Header.Skeleton />}

          <div className="grid grid-cols-1 md:grid-cols-4 md:gap-4 mt-2">
            <div className="col-span-3 space-y-5">
              {cardData ? <CardMeta data={cardData} /> : null}
              {cardData ? <TranslatePanel data={cardData} /> : null}
              {cardData ? <Description data={cardData} /> : <Description.Skeleton />}
              {cardData ? <Checklists data={cardData} /> : null}
              {cardData ? <Attachments data={cardData} /> : null}
              {cardData ? <Comments cardId={cardData.id} /> : null}
              {auditLogsData ? <Activity data={auditLogsData} /> : <Activity.Skeleton />}
            </div>

            {cardData ? <ActionsSidebar data={cardData} /> : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
