"use client";

import { useIsClient } from "usehooks-ts";

import { CardModal } from "@/components/modals/card-modal";
import { ProModal } from "@/components/modals/pro-modal";

export const ModalProvider = () => {
  const isClient = useIsClient();

  if (!isClient) return null;

  return (
    <>
      <CardModal />
      <ProModal />
    </>
  );
};
