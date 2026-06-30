"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganizationList } from "@clerk/nextjs";

export const OrgControl = () => {
  const params = useParams();
  const router = useRouter();
  const { setActive, isLoaded } = useOrganizationList();

  useEffect(() => {
    if (!isLoaded || !setActive) return;

    setActive({ organization: params.organizationId as string }).then(() => {
      router.refresh();
    });
  }, [isLoaded, setActive, params.organizationId, router]);

  return null;
};
