"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useCardModal } from "@/hooks/use-card-modal";

export const CardDeepLink = () => {
  const searchParams = useSearchParams();
  const cardModal = useCardModal();
  const cardId = searchParams.get("card");

  useEffect(() => {
    if (cardId) cardModal.onOpen(cardId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  return null;
};
