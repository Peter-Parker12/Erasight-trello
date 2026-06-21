"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Plus, Trash2 } from "lucide-react";
import type { ApiKey } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { createApiKey } from "@/actions/create-api-key";
import { deleteApiKey } from "@/actions/delete-api-key";

type ApiKeysManagerProps = {
  apiKeys: ApiKey[];
};

export const ApiKeysManager = ({ apiKeys }: ApiKeysManagerProps) => {
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const { execute: executeCreate, isLoading: isCreating } = useAction(createApiKey, {
    onSuccess: (data) => {
      setCreatedKey(data.key);
      setName("");
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeDelete, isLoading: isDeleting } = useAction(deleteApiKey, {
    onSuccess: () => toast.success("API key deleted."),
    onError: (error) => toast.error(error),
  });

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    executeCreate({ name: name.trim() });
  };

  const onDelete = (apiKey: ApiKey) => {
    if (!confirm(`Delete the API key "${apiKey.name}"? Any integration using it will stop working.`)) return;
    executeDelete({ id: apiKey.id });
  };

  const onCopy = async (key: string) => {
    await navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard.");
  };

  return (
    <div className="space-y-4">
      {createdKey && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <p className="text-sm font-medium">
            Your new API key — copy it now, you won&apos;t be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={createdKey} className="font-mono text-xs h-8" />
            <Button size="sm" variant="outline" onClick={() => onCopy(createdKey)}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setCreatedKey(null)}>
            Done
          </Button>
        </div>
      )}

      <form onSubmit={onCreate} className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. Zapier integration)"
          className="h-9 text-sm flex-1"
        />
        <Button type="submit" size="sm" disabled={isCreating || !name.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Generate key
        </Button>
      </form>

      {apiKeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">No API keys yet.</p>
      ) : (
        <div className="rounded-md border divide-y">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{apiKey.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {apiKey.keyPrefix}••••••••••••••••
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {apiKey.createdAt.toLocaleDateString()}
                  {apiKey.lastUsedAt
                    ? ` · Last used ${apiKey.lastUsedAt.toLocaleDateString()}`
                    : " · Never used"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                disabled={isDeleting}
                onClick={() => onDelete(apiKey)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
