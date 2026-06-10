"use client";

import { useIsClient } from "usehooks-ts";

import { CardModal } from "@/components/modals/card-modal";

export const ModalProvider = () => {
  const isClient = useIsClient();

  if (!isClient) return null;

  return <CardModal />;
};
