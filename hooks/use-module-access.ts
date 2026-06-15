"use client";

import { useEffect, useState } from "react";

import { MODULE_KEYS, type ModuleKey } from "@/lib/modules";

const ALL_ACCESSIBLE = Object.fromEntries(
  MODULE_KEYS.map((key) => [key, true])
) as Record<ModuleKey, boolean>;

// Defaults to "everything accessible" so nav items don't flicker/disappear
// for the common case (no org has configured restrictions yet).
export const useModuleAccess = (orgId: string | undefined) => {
  const [modules, setModules] = useState<Record<ModuleKey, boolean>>(ALL_ACCESSIBLE);

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;

    fetch(`/api/module-access?orgId=${orgId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setModules(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return modules;
};
