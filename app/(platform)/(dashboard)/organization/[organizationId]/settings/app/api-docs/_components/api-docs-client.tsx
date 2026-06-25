"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Code, Key, Info, BookOpen, FileJson, Download } from "lucide-react";
import type { ApiKey, CustomFieldDefinition } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RESOURCE_CATALOG, ACTION_CATALOG } from "@/lib/openapi-spec";

type ApiDocsClientProps = {
  apiKeys: ApiKey[];
  customFields: CustomFieldDefinition[];
  orgId: string;
};

type TabKey =
  | "overview"
  | "openapi"
  | { resource: string };

export const ApiDocsClient = ({ apiKeys, customFields, orgId }: ApiDocsClientProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const activeKeyName = apiKeys.length > 0 ? apiKeys[0].name : null;
  const activeKeyDisplay = apiKeys.length > 0
    ? `${apiKeys[0].keyPrefix}••••••••••••••••`
    : "ea_live_your_actual_api_key_goes_here";
  const activeKeyRaw = apiKeys.length > 0
    ? `ea_live_example_${apiKeys[0].keyPrefix}xxxxxxxx`
    : "ea_live_your_actual_api_key_goes_here";

  // Custom fields grouped by entityType for CRM tabs.
  const customFieldsByEntity = (entityType: string) =>
    customFields.filter((f) => f.entityType === entityType);

  const getCustomFieldExample = (field: CustomFieldDefinition) => {
    switch (field.fieldType) {
      case "NUMBER":
      case "CURRENCY":
        return 15000;
      case "BOOLEAN":
        return true;
      case "DATE":
        return "2026-06-22";
      case "MULTI_SELECT":
        return ["Option A", "Option B"];
      case "EMAIL":
        return "partner@company.com";
      case "PHONE":
        return "+1-555-0199";
      case "URL":
        return "https://partner.com";
      default:
        return "example value";
    }
  };

  const buildResourcePayload = (
    pathSegment: string,
    standardFields: { key: string; required: boolean; type: string }[],
    customEntityFields?: CustomFieldDefinition[]
  ) => {
    const payload: Record<string, any> = {};
    for (const f of standardFields) {
      if (!f.required) continue;
      payload[f.key] = exampleForStandardField(f.key, f.type);
    }
    if (customEntityFields && customEntityFields.length > 0) {
      payload.customFields = {};
      customEntityFields.forEach((f) => {
        payload.customFields[f.key] = getCustomFieldExample(f);
      });
    }
    // Suppress unused-warning for pathSegment; placeholder kept for future
    // per-resource overrides.
    void pathSegment;
    return payload;
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedText(null), 2000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:9090";

  const isResourceTab = (t: TabKey): t is { resource: string } =>
    typeof t === "object" && t !== null && "resource" in t;

  const activeResourceCfg = isResourceTab(activeTab)
    ? RESOURCE_CATALOG.find((c) => c.pathSegment === activeTab.resource)
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar Tabs */}
      <div className="md:col-span-1 flex flex-col gap-1 max-h-[80vh] overflow-y-auto pr-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            tabButtonClass(activeTab === "overview")
          )}
        >
          <BookOpen className="h-4 w-4" />
          Overview
        </button>

        {RESOURCE_CATALOG.map((c) => {
          const isActive =
            isResourceTab(activeTab) && activeTab.resource === c.pathSegment;
          return (
            <button
              key={c.pathSegment}
              onClick={() => setActiveTab({ resource: c.pathSegment })}
              className={cn(tabButtonClass(isActive))}
            >
              <Terminal className="h-4 w-4" />
              <span className="capitalize">{c.pathSegment.replace(/-/g, " ")} API</span>
            </button>
          );
        })}

        <button
          onClick={() => setActiveTab("openapi")}
          className={cn(tabButtonClass(activeTab === "openapi"))}
        >
          <FileJson className="h-4 w-4" />
          OpenAPI Schema
        </button>
      </div>

      {/* Content Area */}
      <div className="md:col-span-3 space-y-6">
        {activeTab === "overview" && (
          <OverviewTab
            activeKeyName={activeKeyName}
            activeKeyDisplay={activeKeyDisplay}
            baseUrl={baseUrl}
          />
        )}

        {activeResourceCfg && (
          <ResourceTab
            cfg={activeResourceCfg}
            customFields={
              activeResourceCfg.kind === "crm"
                ? customFieldsByEntity(activeResourceCfg.entityType)
                : []
            }
            baseUrl={baseUrl}
            activeKeyRaw={activeKeyRaw}
            copiedText={copiedText}
            onCopy={handleCopy}
            buildPayload={(pathSegment, standardFields) =>
              buildResourcePayload(
                pathSegment,
                standardFields,
                activeResourceCfg.kind === "crm"
                  ? customFieldsByEntity(activeResourceCfg.entityType)
                  : undefined
              )
            }
          />
        )}

        {activeTab === "openapi" && (
          <OpenApiTab
            baseUrl={baseUrl}
            activeKeyName={activeKeyName}
            activeKeyRaw={activeKeyRaw}
            customFields={customFields}
            copiedText={copiedText}
            onCopy={handleCopy}
          />
        )}
      </div>
    </div>
  );
};

const tabButtonClass = (active: boolean) =>
  cn(
    "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition text-left",
    active
      ? "bg-[#222] text-violet-400 border border-[#333]"
      : "text-[#888] hover:text-[#e5e5e5] hover:bg-[#111]"
  );

const exampleForStandardField = (key: string, type: string) => {
  if (key === "title") return "Enterprise Deal 2026";
  if (key === "name") return "Acme Corp";
  if (key === "firstName") return "John";
  if (key === "lastName") return "Doe";
  if (key === "email") return "john@doe.com";
  if (key === "phone") return "+1-555-0100";
  if (key === "domain") return "acme.com";
  if (key === "industry") return "Technology";
  if (key === "website") return "https://acme.com";
  if (key === "unitPrice" || type === "CURRENCY") return 99.0;
  if (type === "NUMBER") return 1;
  if (type === "BOOLEAN") return false;
  if (type === "DATE") return "2026-06-25";
  return "example value";
};

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

const OverviewTab = ({
  activeKeyName,
  activeKeyDisplay,
  baseUrl,
}: {
  activeKeyName: string | null;
  activeKeyDisplay: string;
  baseUrl: string;
}) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-[#e5e5e5]">Authentication & Overview</h2>
      <p className="text-sm text-muted-foreground">
        All requests to the CRM API must be authenticated using an API Key. Key must be supplied
        via the Authorization header as a Bearer token.
      </p>
    </div>

    <div className="rounded-md border p-4 bg-[#111] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold flex items-center gap-2 text-amber-400">
          <Key className="h-4 w-4" />
          Authentication Header Example
        </span>
        {activeKeyName && (
          <span className="text-xs px-2 py-0.5 rounded bg-violet-900/30 text-violet-300 font-medium">
            Using: {activeKeyName}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between bg-black/40 p-2.5 rounded border border-[#222] font-mono text-xs text-[#a9b1d6]">
        <span>Authorization: Bearer {activeKeyDisplay}</span>
      </div>
      {!activeKeyName && (
        <p className="text-xs text-amber-500">
          ⚠️ No API Keys generated yet for this organization.
          Generate one under the <strong>API Keys</strong> tab to test.
        </p>
      )}
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[#e5e5e5]">API Base URL</h3>
      <div className="flex items-center justify-between bg-[#111] p-3 rounded border font-mono text-xs text-violet-400">
        <span>{baseUrl}/api/v1</span>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[#e5e5e5]">Error Responses</h3>
      <p className="text-sm text-muted-foreground">
        The API uses standard HTTP response codes to indicate the success or failure of an API request.
      </p>
      <div className="border rounded-md divide-y overflow-hidden">
        <div className="grid grid-cols-4 p-2.5 text-xs font-semibold bg-[#111] text-muted-foreground">
          <div className="col-span-1">Code</div>
          <div className="col-span-3">Meaning</div>
        </div>
        <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
          <div className="col-span-1 text-emerald-400 font-medium">200 / 201</div>
          <div className="col-span-3">Success / Created. Request completed successfully.</div>
        </div>
        <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
          <div className="col-span-1 text-rose-400 font-medium">401</div>
          <div className="col-span-3">Unauthorized. Missing or invalid API key.</div>
        </div>
        <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
          <div className="col-span-1 text-rose-400 font-medium">404</div>
          <div className="col-span-3">Not Found. The requested entity does not exist.</div>
        </div>
        <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
          <div className="col-span-1 text-rose-400 font-medium">422</div>
          <div className="col-span-3">Unprocessable Entity. Validation failed (e.g. invalid fields).</div>
        </div>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Resource tab (works for both CRM entities and plain resources)
// ---------------------------------------------------------------------------

type ResourceCfg = (typeof RESOURCE_CATALOG)[number];

const ResourceTab = ({
  cfg,
  customFields,
  baseUrl,
  activeKeyRaw,
  copiedText,
  onCopy,
  buildPayload,
}: {
  cfg: ResourceCfg;
  customFields: CustomFieldDefinition[];
  baseUrl: string;
  activeKeyRaw: string;
  copiedText: string | null;
  onCopy: (text: string, id: string) => Promise<void>;
  buildPayload: (
    pathSegment: string,
    standardFields: { key: string; required: boolean; type: string }[]
  ) => Record<string, unknown>;
}) => {
  const labelSingular = cfg.singularLabel;
  const title = cfg.pathSegment.replace(/-/g, " ");

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[#e5e5e5] capitalize">{title} Management</h2>
        <p className="text-sm text-muted-foreground">
          Interact with {title} records. Standard fields
          {cfg.kind === "crm" && " and organization-specific custom fields"} are listed below.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#e5e5e5]">Endpoints</h3>

        {/* GET List */}
        <EndpointBlock
          method="GET"
          methodColor="emerald"
          path={`/api/v1/${cfg.pathSegment}`}
          description={`List all ${cfg.pathSegment}`}
          curl={`curl -X GET "${baseUrl}/api/v1/${cfg.pathSegment}?limit=10"\n  -H "Authorization: Bearer ${activeKeyRaw}"`}
          copyId={`get-list-${cfg.pathSegment}`}
          copiedText={copiedText}
          onCopy={onCopy}
          notes="Query parameters: limit (default 50, max 100), offset (default 0)."
        />

        {/* POST Create */}
        <EndpointBlock
          method="POST"
          methodColor="violet"
          path={`/api/v1/${cfg.pathSegment}`}
          description={`Create a new ${labelSingular}`}
          curl={`curl -X POST "${baseUrl}/api/v1/${cfg.pathSegment}" \\\n  -H "Authorization: Bearer ${activeKeyRaw}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(buildPayload(cfg.pathSegment, cfg.standardFields as unknown as { key: string; required: boolean; type: string }[]), null, 2)}'`}
          copyId={`create-${cfg.pathSegment}`}
          copiedText={copiedText}
          onCopy={onCopy}
        />

        {/* GET by ID */}
        <EndpointBlock
          method="GET"
          methodColor="emerald"
          path={`/api/v1/${cfg.pathSegment}/{id}`}
          description={`Retrieve a single ${labelSingular} by ID`}
          curl={`curl -X GET "${baseUrl}/api/v1/${cfg.pathSegment}/550e8400-e29b-41d4-a716-446655440000" \\\n  -H "Authorization: Bearer ${activeKeyRaw}"`}
          copyId={`get-by-id-${cfg.pathSegment}`}
          copiedText={copiedText}
          onCopy={onCopy}
        />

        {/* PATCH */}
        <EndpointBlock
          method="PATCH"
          methodColor="amber"
          path={`/api/v1/${cfg.pathSegment}/{id}`}
          description={`Update an existing ${labelSingular}`}
          curl={`curl -X PATCH "${baseUrl}/api/v1/${cfg.pathSegment}/550e8400-e29b-41d4-a716-446655440000" \\\n  -H "Authorization: Bearer ${activeKeyRaw}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(buildPayload(cfg.pathSegment, cfg.standardFields as unknown as { key: string; required: boolean; type: string }[]), null, 2)}'`}
          copyId={`update-${cfg.pathSegment}`}
          copiedText={copiedText}
          onCopy={onCopy}
          notes="Send partial or full fields. Only the fields you include will be updated."
        />

        {/* DELETE */}
        <EndpointBlock
          method="DELETE"
          methodColor="rose"
          path={`/api/v1/${cfg.pathSegment}/{id}`}
          description={`Delete a ${labelSingular} by ID`}
          curl={`curl -X DELETE "${baseUrl}/api/v1/${cfg.pathSegment}/550e8400-e29b-41d4-a716-446655440000" \\\n  -H "Authorization: Bearer ${activeKeyRaw}"`}
          copyId={`delete-${cfg.pathSegment}`}
          copiedText={copiedText}
          onCopy={onCopy}
          notes="Returns the deleted id on success."
        />

        {/* Schema table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#e5e5e5]">
            <Info className="h-3.5 w-3.5 text-amber-500" />
            Schema Definitions
          </div>
          <div className="border rounded-md overflow-hidden divide-y">
            <div className="grid grid-cols-4 p-2.5 text-xs font-semibold bg-[#111] text-muted-foreground">
              <div className="col-span-1">Field Key</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-1">Required</div>
              <div className="col-span-1">Origin</div>
            </div>

            {cfg.standardFields.map((f) => (
              <div key={f.key} className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                <div className="col-span-1 font-mono text-white">{f.key}</div>
                <div className="col-span-1">{f.type}</div>
                <div className="col-span-1">
                  {f.required ? (
                    <span className="text-amber-500 font-semibold">Yes</span>
                  ) : (
                    "No"
                  )}
                </div>
                <div className="col-span-1 text-emerald-400">Standard</div>
              </div>
            ))}

            {cfg.kind === "crm" &&
              (customFields.length === 0 ? (
                <div className="p-3 text-xs text-center text-muted-foreground">
                  No custom fields defined for this entity.
                </div>
              ) : (
                customFields.map((f) => (
                  <div key={f.id} className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground bg-[#1c1c1f]/20">
                    <div className="col-span-1 font-mono text-violet-300">customFields.{f.key}</div>
                    <div className="col-span-1 font-semibold">{f.fieldType}</div>
                    <div className="col-span-1">
                      {f.required ? <span className="text-amber-500 font-semibold">Yes</span> : "No"}
                    </div>
                    <div className="col-span-1 text-violet-400 font-semibold">Custom Field</div>
                  </div>
                ))
              ))}
          </div>
        </div>

        {/* Specialized actions for this resource */}
        {ACTION_CATALOG.filter((a) =>
          a.path.startsWith(`/api/v1/${cfg.pathSegment}/`)
        ).map((a) => (
          <EndpointBlock
            key={a.path}
            method="POST"
            methodColor="violet"
            path={a.path}
            description={a.summary}
            curl={`curl -X POST "${baseUrl}${a.path}" \\\n  -H "Authorization: Bearer ${activeKeyRaw}" \\\n  -H "Content-Type: application/json"${a.requestBodySchema ? ` \\\n  -d '${JSON.stringify(exampleForAction(a.path), null, 2)}'` : ""}`}
            copyId={`action-${a.path}`}
            copiedText={copiedText}
            onCopy={onCopy}
            notes={a.description}
          />
        ))}
      </div>
    </div>
  );
};

const exampleForAction = (path: string): Record<string, unknown> => {
  if (path.endsWith("/cards/{id}/move")) return { targetListId: "list-uuid", order: 0 };
  if (path.endsWith("/cards/{id}/reorder")) return { order: 0 };
  if (path.endsWith("/cards/{id}/watch")) return { watch: true };
  if (path.endsWith("/leads/{id}/move")) {
    return { items: [{ id: "lead-uuid", stageId: "stage-uuid", order: 0 }] };
  }
  if (path.endsWith("/leads/{id}/products")) return { productIds: ["product-uuid"] };
  if (path.endsWith("/companies/{id}/enrich")) return { overrideMode: "SKIP_FILLED" };
  if (path.endsWith("/companies/{id}/assign-bundle")) return { bundleId: "bundle-uuid" };
  return {};
};

// ---------------------------------------------------------------------------
// Endpoint block
// ---------------------------------------------------------------------------

const EndpointBlock = ({
  method,
  methodColor,
  path,
  description,
  curl,
  copyId,
  copiedText,
  onCopy,
  notes,
}: {
  method: string;
  methodColor: "emerald" | "violet" | "amber" | "rose";
  path: string;
  description: string;
  curl: string;
  copyId: string;
  copiedText: string | null;
  onCopy: (text: string, id: string) => Promise<void>;
  notes?: string;
}) => {
  const colorClasses: Record<typeof methodColor, string> = {
    emerald: "bg-emerald-950 text-emerald-400 border-emerald-800",
    violet: "bg-violet-950 text-violet-400 border-violet-800",
    amber: "bg-amber-950 text-amber-400 border-amber-800",
    rose: "bg-rose-950 text-rose-400 border-rose-800",
  };
  return (
    <div className="border rounded-md overflow-hidden bg-[#111]">
      <div className="flex items-center justify-between p-3 border-b bg-black/20">
        <div className="flex items-center gap-3">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", colorClasses[methodColor])}>
            {method}
          </span>
          <span className="font-mono text-xs text-[#a9b1d6]">{path}</span>
        </div>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <div className="p-3 space-y-3">
        {notes && <p className="text-xs text-muted-foreground">{notes}</p>}
        <div className="relative group">
          <pre className="p-3 bg-black/60 rounded border border-[#222] font-mono text-[11px] text-[#888] overflow-x-auto">
            {curl}
          </pre>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopy(curl, copyId)}
            className="absolute right-2 top-2 h-7 px-2 bg-[#111] opacity-0 group-hover:opacity-100 transition"
          >
            {copiedText === copyId ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// OpenAPI tab
// ---------------------------------------------------------------------------

const OpenApiTab = ({
  baseUrl,
  activeKeyName,
  activeKeyRaw,
  customFields,
  copiedText,
  onCopy,
}: {
  baseUrl: string;
  activeKeyName: string | null;
  activeKeyRaw: string;
  customFields: CustomFieldDefinition[];
  copiedText: string | null;
  onCopy: (text: string, id: string) => Promise<void>;
}) => {
  const companyCustom = customFields.filter((f) => f.entityType === "COMPANY").length;
  const contactCustom = customFields.filter((f) => f.entityType === "CONTACT").length;
  const leadCustom = customFields.filter((f) => f.entityType === "LEAD").length;
  const productCustom = customFields.filter((f) => f.entityType === "PRODUCT").length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[#e5e5e5]">OpenAPI 3.0 Schema</h2>
        <p className="text-sm text-muted-foreground">
          Spec below is generated dynamically per organization from the current standard and
          custom field definitions. Each call fetches the latest config, so newly added or
          removed custom fields appear immediately (no server restart required).
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#e5e5e5]">Endpoint URL</h3>
        <div className="flex items-center justify-between bg-[#111] p-3 rounded border font-mono text-xs text-violet-400">
          <span>{baseUrl}/api/v1/openapi</span>
        </div>
      </div>

      {activeKeyName ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-400">
              <Code className="h-3.5 w-3.5" />
              Fetch the spec
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch(`${baseUrl}/api/v1/openapi`, {
                    headers: { Authorization: `Bearer ${activeKeyRaw}` },
                  });
                  if (!res.ok) {
                    toast.error(`Failed: ${res.status}`);
                    return;
                  }
                  const spec = await res.json();
                  const blob = new Blob([JSON.stringify(spec, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "openapi.json";
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Downloaded openapi.json");
                } catch {
                  toast.error("Failed to fetch spec.");
                }
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download openapi.json
            </Button>
          </div>

          {(() => {
            const curlCmd = `curl -H "Authorization: Bearer ${activeKeyRaw}" \\\n  ${baseUrl}/api/v1/openapi`;
            return (
              <div className="relative group">
                <pre className="p-3 bg-black/60 rounded border border-[#222] font-mono text-[11px] text-[#888] overflow-x-auto">
                  {curlCmd}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCopy(curlCmd, "openapi-curl")}
                  className="absolute right-2 top-2 h-7 px-2 bg-[#111] opacity-0 group-hover:opacity-100 transition"
                >
                  {copiedText === "openapi-curl" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            );
          })()}
        </div>
      ) : (
        <p className="text-xs text-amber-500">
          ⚠️ No API Keys generated yet. Generate one under the <strong>API Keys</strong> tab
          to download or query the OpenAPI spec.
        </p>
      )}

      <div className="rounded-md border p-4 bg-[#111] space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
          <Info className="h-4 w-4" />
          Using with Swagger Editor
        </div>
        <p className="text-xs text-muted-foreground">
          The endpoint requires authentication, so the spec cannot be loaded directly by a
          public Swagger UI. Use <span className="text-violet-400">Download openapi.json</span>{" "}
          above, then import it into{" "}
          <a
            href="https://editor.swagger.io/"
            target="_blank"
            rel="noreferrer"
            className="text-violet-400 underline"
          >
            editor.swagger.io
          </a>{" "}
          via <em>File → Import file</em>.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#e5e5e5]">Schema overview</h3>
        <div className="border rounded-md overflow-hidden divide-y">
          <div className="grid grid-cols-4 p-2.5 text-xs font-semibold bg-[#111] text-muted-foreground">
            <div className="col-span-1">Resource</div>
            <div className="col-span-1">Standard fields</div>
            <div className="col-span-1">Custom fields</div>
            <div className="col-span-1">Paths</div>
          </div>
          {RESOURCE_CATALOG.map((row) => {
            const custom =
              row.kind === "crm"
                ? row.entityType === "COMPANY"
                  ? companyCustom
                  : row.entityType === "CONTACT"
                  ? contactCustom
                  : row.entityType === "LEAD"
                  ? leadCustom
                  : productCustom
                : 0;
            return (
              <div key={row.pathSegment} className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                <div className="col-span-1 font-mono text-white capitalize">{row.pathSegment.replace(/-/g, " ")}</div>
                <div className="col-span-1">{row.standardFields.length}</div>
                <div className="col-span-1 text-violet-300">{custom}</div>
                <div className="col-span-1">5</div>
              </div>
            );
          })}
          <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
            <div className="col-span-1 font-mono text-white">specialized actions</div>
            <div className="col-span-1">—</div>
            <div className="col-span-1">—</div>
            <div className="col-span-1">{ACTION_CATALOG.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
