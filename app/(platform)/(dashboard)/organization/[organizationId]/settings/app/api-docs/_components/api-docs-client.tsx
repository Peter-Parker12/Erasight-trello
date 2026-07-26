"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Code, Key, Info, BookOpen, FileJson, Download, Database } from "lucide-react";
import type { ApiKey, CustomFieldDefinition } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ApiDocsClientProps = {
  apiKeys: ApiKey[];
  customFields: CustomFieldDefinition[];
  orgId: string;
};

type TabType = "overview" | "companies" | "contacts" | "leads" | "schema" | "openapi";

type StdField = { key: string; type: string; required: boolean; note?: string };

const COMPANY_STD_FIELDS: StdField[] = [
  { key: "name", type: "TEXT", required: true },
  { key: "domain", type: "TEXT", required: false },
  { key: "industry", type: "TEXT", required: false },
  { key: "phone", type: "PHONE", required: false },
  { key: "website", type: "URL", required: false },
  { key: "address", type: "TEXT", required: false },
  { key: "description", type: "TEXT", required: false },
];

const CONTACT_STD_FIELDS: StdField[] = [
  { key: "firstName", type: "TEXT", required: true },
  { key: "lastName", type: "TEXT", required: false },
  { key: "email", type: "EMAIL", required: false },
  { key: "phone", type: "PHONE", required: false },
  { key: "title", type: "TEXT", required: false },
  { key: "companyId", type: "UUID", required: false, note: "References a Company record" },
];

const LEAD_STD_FIELDS: StdField[] = [
  { key: "title", type: "TEXT", required: true },
  { key: "value", type: "NUMBER", required: false },
  { key: "stageId", type: "UUID", required: false, note: "Pipeline stage; defaults to first stage if omitted" },
  { key: "ownerId", type: "UUID", required: false, note: "Assigned user ID" },
  { key: "companyId", type: "UUID", required: false, note: "References a Company record" },
  { key: "contactId", type: "UUID", required: false, note: "References a Contact record" },
  { key: "productIds", type: "UUID[]", required: false, note: "Array of Product IDs" },
];

const ENTITY_META = {
  companies: { label: "Company", stdFields: COMPANY_STD_FIELDS },
  contacts: { label: "Contact", stdFields: CONTACT_STD_FIELDS },
  leads: { label: "Lead", stdFields: LEAD_STD_FIELDS },
} as const;

type EntityKey = keyof typeof ENTITY_META;

const METHOD_STYLES = {
  GET: "bg-emerald-950 text-emerald-400 border-emerald-800",
  POST: "bg-violet-950 text-primary border-violet-800",
  PATCH: "bg-amber-950 text-amber-400 border-amber-800",
  DELETE: "bg-rose-950 text-rose-400 border-rose-800",
} as const;

const MethodBadge = ({ method }: { method: keyof typeof METHOD_STYLES }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${METHOD_STYLES[method]}`}>
    {method}
  </span>
);

export const ApiDocsClient = ({ apiKeys, customFields, orgId }: ApiDocsClientProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const activeKeyName = apiKeys.length > 0 ? apiKeys[0].name : null;
  const activeKeyDisplay = apiKeys.length > 0
    ? `${apiKeys[0].keyPrefix}••••••••••••••••`
    : "ea_live_your_actual_api_key_goes_here";
  const activeKeyRaw = apiKeys.length > 0
    ? `ea_live_example_${apiKeys[0].keyPrefix}xxxxxxxx`
    : "ea_live_your_actual_api_key_goes_here";

  const companyCustomFields = customFields.filter(f => f.entityType === "COMPANY");
  const contactCustomFields = customFields.filter(f => f.entityType === "CONTACT");
  const leadCustomFields = customFields.filter(f => f.entityType === "LEAD");

  const getCustomFieldExample = (field: CustomFieldDefinition) => {
    switch (field.fieldType) {
      case "NUMBER": case "CURRENCY": return 15000;
      case "BOOLEAN": return true;
      case "DATE": return "2026-06-28";
      case "MULTI_SELECT": return ["Option A", "Option B"];
      case "EMAIL": return "partner@company.com";
      case "PHONE": return "+1-555-0199";
      case "URL": return "https://partner.com";
      default: return "example value";
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedText(null), 2000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:9090";

  const renderCopyBlock = (code: string, id: string) => (
    <div className="relative group">
      <pre className="p-3 bg-muted rounded border border-border font-mono text-[11px] text-muted-foreground overflow-x-auto">
        {code}
      </pre>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleCopy(code, id)}
        className="absolute right-2 top-2 h-7 px-2 bg-muted opacity-0 group-hover:opacity-100 transition"
      >
        {copiedText === id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );

  const renderSidebarBtn = (tab: TabType, icon: React.ReactNode, label: string) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition text-left",
        activeTab === tab
          ? "bg-secondary text-primary border border-border"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      {icon}
      {label}
    </button>
  );

  const renderEntityTab = (tab: EntityKey) => {
    const meta = ENTITY_META[tab];
    const singular = meta.label.toLowerCase();
    const customFlds = tab === "companies" ? companyCustomFields
      : tab === "contacts" ? contactCustomFields
      : leadCustomFields;

    const postPayload: Record<string, unknown> = {};
    if (tab === "companies") {
      postPayload.name = "Acme Corp";
      postPayload.domain = "acme.com";
      postPayload.industry = "Technology";
      postPayload.phone = "+1-555-0100";
      postPayload.website = "https://acme.com";
    } else if (tab === "contacts") {
      postPayload.firstName = "Jane";
      postPayload.lastName = "Smith";
      postPayload.email = "jane@acme.com";
      postPayload.phone = "+1-555-0102";
      postPayload.title = "Director of Operations";
    } else {
      postPayload.title = "Enterprise Deal 2026";
      postPayload.value = 50000;
    }
    if (customFlds.length > 0) {
      postPayload.customFields = Object.fromEntries(
        customFlds.map(f => [f.key, getCustomFieldExample(f)])
      );
    }

    const patchPayload: Record<string, unknown> =
      tab === "companies" ? { industry: "SaaS", website: "https://newsite.com" }
      : tab === "contacts" ? { title: "VP of Engineering" }
      : { value: 75000 };

    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground capitalize">{tab} API</h2>
          <p className="text-sm text-muted-foreground">
            Full CRUD + search for {tab}. All fields are validated against the org&apos;s current schema.
          </p>
        </div>

        {/* Endpoint quick-reference */}
        <div className="border rounded-md overflow-hidden divide-y text-xs">
          <div className="grid grid-cols-4 p-2.5 bg-muted font-semibold text-muted-foreground">
            <div className="col-span-1">Method</div>
            <div className="col-span-2">Path</div>
            <div className="col-span-1">Action</div>
          </div>
          {([
            { method: "GET",    path: `/api/v1/${tab}`,      desc: `List / search` },
            { method: "GET",    path: `/api/v1/${tab}/{id}`, desc: `Get by ID` },
            { method: "POST",   path: `/api/v1/${tab}`,      desc: `Create` },
            { method: "PATCH",  path: `/api/v1/${tab}/{id}`, desc: `Update (partial)` },
            { method: "DELETE", path: `/api/v1/${tab}/{id}`, desc: `Delete` },
          ] as { method: keyof typeof METHOD_STYLES; path: string; desc: string }[]).map(row => (
            <div key={row.method + row.path} className="grid grid-cols-4 p-2.5 items-center text-muted-foreground">
              <div className="col-span-1"><MethodBadge method={row.method} /></div>
              <div className="col-span-2 font-mono text-[10px] text-[#a9b1d6]">{row.path}</div>
              <div className="col-span-1">{row.desc}</div>
            </div>
          ))}
        </div>

        {/* GET LIST */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <MethodBadge method="GET" />
            <span className="font-mono text-xs text-[#a9b1d6]">/api/v1/{tab}</span>
            <span className="text-xs text-muted-foreground">— List / search {tab}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Query params:{" "}
            <code className="text-primary">q</code> (search term, case-insensitive),{" "}
            <code className="text-primary">limit</code> (1–100, default 50),{" "}
            <code className="text-primary">offset</code> (default 0).
            {tab === "companies" && " Searches name and domain."}
            {tab === "contacts" && " Searches firstName, lastName, and email."}
            {tab === "leads" && " Searches title."}
          </p>
          {renderCopyBlock(
            `curl "${baseUrl}/api/v1/${tab}?q=acme&limit=10" \\\n  -H "Authorization: Bearer ${activeKeyRaw}"`,
            `get-list-${tab}`
          )}
        </div>

        {/* GET BY ID */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <MethodBadge method="GET" />
            <span className="font-mono text-xs text-[#a9b1d6]">/api/v1/{tab}/{"{"}{singular}Id{"}"}</span>
            <span className="text-xs text-muted-foreground">— Get by ID</span>
          </div>
          {renderCopyBlock(
            `curl "${baseUrl}/api/v1/${tab}/RECORD_ID_HERE" \\\n  -H "Authorization: Bearer ${activeKeyRaw}"`,
            `get-one-${tab}`
          )}
        </div>

        {/* POST CREATE */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <MethodBadge method="POST" />
            <span className="font-mono text-xs text-[#a9b1d6]">/api/v1/{tab}</span>
            <span className="text-xs text-muted-foreground">— Create {singular}</span>
          </div>
          {renderCopyBlock(
            `curl -X POST "${baseUrl}/api/v1/${tab}" \\\n  -H "Authorization: Bearer ${activeKeyRaw}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(postPayload, null, 2)}'`,
            `create-${tab}`
          )}
        </div>

        {/* PATCH UPDATE */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <MethodBadge method="PATCH" />
            <span className="font-mono text-xs text-[#a9b1d6]">/api/v1/{tab}/{"{"}{singular}Id{"}"}</span>
            <span className="text-xs text-muted-foreground">— Partial update (only send changed fields)</span>
          </div>
          {renderCopyBlock(
            `curl -X PATCH "${baseUrl}/api/v1/${tab}/RECORD_ID_HERE" \\\n  -H "Authorization: Bearer ${activeKeyRaw}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(patchPayload, null, 2)}'`,
            `patch-${tab}`
          )}
        </div>

        {/* DELETE */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <MethodBadge method="DELETE" />
            <span className="font-mono text-xs text-[#a9b1d6]">/api/v1/{tab}/{"{"}{singular}Id{"}"}</span>
            <span className="text-xs text-muted-foreground">— Delete {singular} (permanent)</span>
          </div>
          {renderCopyBlock(
            `curl -X DELETE "${baseUrl}/api/v1/${tab}/RECORD_ID_HERE" \\\n  -H "Authorization: Bearer ${activeKeyRaw}"`,
            `delete-${tab}`
          )}
        </div>

        {/* FIELD REFERENCE */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Info className="h-3.5 w-3.5 text-amber-500" />
            Field Reference
          </div>
          <div className="border rounded-md overflow-hidden divide-y">
            <div className="grid grid-cols-4 p-2.5 text-xs font-semibold bg-muted text-muted-foreground">
              <div className="col-span-1">Field</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-1">Required</div>
              <div className="col-span-1">Notes</div>
            </div>
            {meta.stdFields.map((f) => (
              <div key={f.key} className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                <div className="col-span-1 font-mono text-foreground">{f.key}</div>
                <div className="col-span-1">{f.type}</div>
                <div className="col-span-1">
                  {f.required ? <span className="text-amber-500 font-semibold">Yes</span> : "No"}
                </div>
                <div className="col-span-1 text-emerald-400">{f.note ?? "Standard field"}</div>
              </div>
            ))}
            {customFlds.map((f) => (
              <div key={f.id} className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground bg-muted/30">
                <div className="col-span-1 font-mono text-primary">customFields.{f.key}</div>
                <div className="col-span-1 font-semibold">{f.fieldType}</div>
                <div className="col-span-1">
                  {f.required ? <span className="text-amber-500 font-semibold">Yes</span> : "No"}
                </div>
                <div className="col-span-1 text-primary">Custom field</div>
              </div>
            ))}
            {customFlds.length === 0 && (
              <div className="p-3 text-xs text-center text-muted-foreground">
                No custom fields defined for this entity.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="md:col-span-1 flex flex-col gap-1">
        {renderSidebarBtn("overview", <BookOpen className="h-4 w-4" />, "Overview")}
        {renderSidebarBtn("companies", <Terminal className="h-4 w-4" />, "Companies")}
        {renderSidebarBtn("contacts", <Terminal className="h-4 w-4" />, "Contacts")}
        {renderSidebarBtn("leads", <Terminal className="h-4 w-4" />, "Leads")}
        {renderSidebarBtn("schema", <Database className="h-4 w-4" />, "Schema API")}
        {renderSidebarBtn("openapi", <FileJson className="h-4 w-4" />, "OpenAPI Spec")}
      </div>

      {/* Content */}
      <div className="md:col-span-3 space-y-6">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Authentication & Overview</h2>
              <p className="text-sm text-muted-foreground">
                All API requests require an API key supplied as a Bearer token in the{" "}
                <code className="text-primary">Authorization</code> header.
              </p>
            </div>

            <div className="rounded-md border p-4 bg-muted space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2 text-amber-400">
                  <Key className="h-4 w-4" />
                  Authorization Header
                </span>
                {activeKeyName && (
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
                    Using: {activeKeyName}
                  </span>
                )}
              </div>
              <div className="bg-muted p-2.5 rounded border border-border font-mono text-xs text-[#a9b1d6]">
                Authorization: Bearer {activeKeyDisplay}
              </div>
              {!activeKeyName && (
                <p className="text-xs text-amber-500">
                  ⚠️ No API keys yet. Generate one in the <strong>API Keys</strong> settings.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Base URL</h3>
              <div className="bg-muted p-3 rounded border font-mono text-xs text-primary">
                {baseUrl}/api/v1
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Available Resources</h3>
              <div className="border rounded-md overflow-hidden divide-y text-xs">
                <div className="grid grid-cols-4 p-2.5 bg-muted font-semibold text-muted-foreground">
                  <div className="col-span-1">Resource</div>
                  <div className="col-span-3">Operations</div>
                </div>
                {[
                  { res: "/companies",       ops: "List (+ search), Get by ID, Create, Update, Delete" },
                  { res: "/contacts",        ops: "List (+ search), Get by ID, Create, Update, Delete" },
                  { res: "/leads",           ops: "List (+ search), Get by ID, Create, Update, Delete" },
                  { res: "/schema/{entity}", ops: "GET — field definitions (standard + custom)" },
                  { res: "/openapi",         ops: "GET — dynamic OpenAPI 3.0 spec (JSON)" },
                ].map(row => (
                  <div key={row.res} className="grid grid-cols-4 p-2.5 text-muted-foreground">
                    <div className="col-span-1 font-mono text-[#a9b1d6]">{row.res}</div>
                    <div className="col-span-3">{row.ops}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">HTTP Status Codes</h3>
              <div className="border rounded-md divide-y overflow-hidden">
                <div className="grid grid-cols-4 p-2.5 text-xs font-semibold bg-muted text-muted-foreground">
                  <div className="col-span-1">Code</div>
                  <div className="col-span-3">Meaning</div>
                </div>
                {[
                  { code: "200 / 201", color: "text-emerald-400", m: "Success / Created." },
                  { code: "204",       color: "text-emerald-400", m: "No Content. Delete succeeded." },
                  { code: "400",       color: "text-rose-400",    m: "Bad Request. Malformed JSON body." },
                  { code: "401",       color: "text-rose-400",    m: "Unauthorized. Missing or invalid API key." },
                  { code: "404",       color: "text-rose-400",    m: "Not Found. Record does not exist." },
                  { code: "422",       color: "text-rose-400",    m: "Unprocessable Entity. Validation failed." },
                ].map(({ code, color, m }) => (
                  <div key={code} className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                    <div className={`col-span-1 font-medium ${color}`}>{code}</div>
                    <div className="col-span-3">{m}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ENTITY TABS */}
        {(activeTab === "companies" || activeTab === "contacts" || activeTab === "leads") &&
          renderEntityTab(activeTab)}

        {/* SCHEMA API TAB */}
        {activeTab === "schema" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Schema API</h2>
              <p className="text-sm text-muted-foreground">
                Discover the current field definitions for each CRM entity — useful for dynamically
                building forms or validating payloads at runtime.
              </p>
            </div>

            {(["companies", "contacts", "leads"] as const).map(entity => (
              <div key={entity} className="space-y-2">
                <div className="flex items-center gap-3">
                  <MethodBadge method="GET" />
                  <span className="font-mono text-xs text-[#a9b1d6]">/api/v1/schema/{entity}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {entity === "leads" ? "— includes pipeline stages" : ""}
                  </span>
                </div>
                {renderCopyBlock(
                  `curl "${baseUrl}/api/v1/schema/${entity}" \\\n  -H "Authorization: Bearer ${activeKeyRaw}"`,
                  `schema-${entity}`
                )}
              </div>
            ))}

            <div className="rounded-md border p-4 bg-muted space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                <Info className="h-4 w-4" />
                Example Response — /schema/companies
              </div>
              <pre className="font-mono text-[11px] text-muted-foreground overflow-x-auto">{`{
  "data": {
    "entityType": "COMPANY",
    "fields": [
      { "key": "name",   "label": "Name",   "type": "TEXT", "required": true  },
      { "key": "domain", "label": "Domain", "type": "TEXT", "required": false },
      ...
    ],
    "customFields": [
      {
        "key": "tier", "label": "Customer Tier",
        "type": "SELECT", "options": ["Bronze","Silver","Gold"],
        "required": false
      }
    ]
  }
}`}</pre>
            </div>

            <div className="rounded-md border p-4 bg-muted space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                <Info className="h-4 w-4" />
                Example Response — /schema/leads (pipeline stages)
              </div>
              <pre className="font-mono text-[11px] text-muted-foreground overflow-x-auto">{`{
  "data": {
    "entityType": "LEAD",
    "fields": [...],
    "customFields": [...],
    "pipelineStages": [
      { "id": "uuid...", "name": "Prospecting", "order": 0, "isWon": false, "isLost": false },
      { "id": "uuid...", "name": "Closed Won",  "order": 3, "isWon": true,  "isLost": false }
    ]
  }
}`}</pre>
            </div>
          </div>
        )}

        {/* OPENAPI SPEC TAB */}
        {activeTab === "openapi" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">OpenAPI 3.0 Spec</h2>
              <p className="text-sm text-muted-foreground">
                Dynamically generated per organization. Covers all Companies, Contacts, and Leads
                endpoints including search, plus schema discovery paths. Custom fields appear
                automatically — no server restart required.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Endpoint</h3>
              <div className="bg-muted p-3 rounded border font-mono text-xs text-primary">
                GET {baseUrl}/api/v1/openapi
              </div>
            </div>

            {activeKeyName ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
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
                        if (!res.ok) { toast.error(`Failed: ${res.status}`); return; }
                        const spec = await res.json();
                        const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "openapi.json";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
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
                {renderCopyBlock(
                  `curl -H "Authorization: Bearer ${activeKeyRaw}" \\\n  ${baseUrl}/api/v1/openapi`,
                  "openapi-curl"
                )}
              </div>
            ) : (
              <p className="text-xs text-amber-500">
                ⚠️ No API keys yet. Generate one in the <strong>API Keys</strong> settings.
              </p>
            )}

            <div className="rounded-md border p-4 bg-muted space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                <Info className="h-4 w-4" />
                Using with Swagger Editor
              </div>
              <p className="text-xs text-muted-foreground">
                The endpoint requires authentication and cannot be loaded directly by a public Swagger UI.
                Download the JSON above, then import into{" "}
                <a
                  href="https://editor.swagger.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  editor.swagger.io
                </a>{" "}
                via <em>File → Import file</em>.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Schema Coverage</h3>
              <div className="border rounded-md overflow-hidden divide-y">
                <div className="grid grid-cols-4 p-2.5 text-xs font-semibold bg-muted text-muted-foreground">
                  <div className="col-span-1">Entity</div>
                  <div className="col-span-1">Std fields</div>
                  <div className="col-span-1">Custom fields</div>
                  <div className="col-span-1">Paths</div>
                </div>
                {[
                  { label: "Companies", custom: companyCustomFields.length, std: COMPANY_STD_FIELDS.length },
                  { label: "Contacts",  custom: contactCustomFields.length, std: CONTACT_STD_FIELDS.length },
                  { label: "Leads",     custom: leadCustomFields.length,    std: LEAD_STD_FIELDS.length },
                ].map(row => (
                  <div key={row.label} className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                    <div className="col-span-1 font-mono text-foreground">{row.label}</div>
                    <div className="col-span-1">{row.std}</div>
                    <div className="col-span-1 text-primary">{row.custom}</div>
                    <div className="col-span-1">5 (+ 1 schema)</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
