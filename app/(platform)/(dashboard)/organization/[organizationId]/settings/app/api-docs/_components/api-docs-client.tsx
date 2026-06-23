"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Code, Key, Info, BookOpen } from "lucide-react";
import type { ApiKey, CustomFieldDefinition } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ApiDocsClientProps = {
  apiKeys: ApiKey[];
  customFields: CustomFieldDefinition[];
  orgId: string;
};

type TabType = "overview" | "companies" | "contacts" | "leads";

export const ApiDocsClient = ({ apiKeys, customFields, orgId }: ApiDocsClientProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Get active API key (or default placeholder)
  const activeKeyName = apiKeys.length > 0 ? apiKeys[0].name : null;
  const activeKeyDisplay = apiKeys.length > 0 
    ? `${apiKeys[0].keyPrefix}••••••••••••••••` 
    : "ea_live_your_actual_api_key_goes_here";
  const activeKeyRaw = apiKeys.length > 0 
    ? `ea_live_example_${apiKeys[0].keyPrefix}xxxxxxxx` 
    : "ea_live_your_actual_api_key_goes_here";

  // Filter custom fields by entity type
  const companyCustomFields = customFields.filter(f => f.entityType === "COMPANY");
  const contactCustomFields = customFields.filter(f => f.entityType === "CONTACT");
  const leadCustomFields = customFields.filter(f => f.entityType === "LEAD");

  // Helper to generate example value based on custom field definition
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

  // Helper to copy code snippets
  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Base URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:9090";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar Tabs */}
      <div className="md:col-span-1 flex flex-col gap-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition text-left",
            activeTab === "overview"
              ? "bg-[#222] text-violet-400 border border-[#333]"
              : "text-[#888] hover:text-[#e5e5e5] hover:bg-[#111]"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition text-left",
            activeTab === "companies"
              ? "bg-[#222] text-violet-400 border border-[#333]"
              : "text-[#888] hover:text-[#e5e5e5] hover:bg-[#111]"
          )}
        >
          <Terminal className="h-4 w-4" />
          Companies API
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition text-left",
            activeTab === "contacts"
              ? "bg-[#222] text-violet-400 border border-[#333]"
              : "text-[#888] hover:text-[#e5e5e5] hover:bg-[#111]"
          )}
        >
          <Terminal className="h-4 w-4" />
          Contacts API
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition text-left",
            activeTab === "leads"
              ? "bg-[#222] text-violet-400 border border-[#333]"
              : "text-[#888] hover:text-[#e5e5e5] hover:bg-[#111]"
          )}
        >
          <Terminal className="h-4 w-4" />
          Leads API
        </button>
      </div>

      {/* Content Area */}
      <div className="md:col-span-3 space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#e5e5e5]">Authentication & Overview</h2>
              <p className="text-sm text-muted-foreground">
                All requests to the CRM API must be authenticated using an API Key. Key must be supplied 
                via the Authorization header as a Bearer token.
              </p>
            </div>

            {/* API Key info box */}
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
        )}

        {/* Dynamic Entities Tab */}
        {activeTab !== "overview" && (
          <div className="space-y-8">
            {/* Entity Header */}
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[#e5e5e5] capitalize">
                {activeTab} Management
              </h2>
              <p className="text-sm text-muted-foreground">
                Interact with {activeTab} records. Standard fields and organization-specific custom fields are mapped below.
              </p>
            </div>

            {/* API Endpoints */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#e5e5e5]">Endpoints</h3>
              
              {/* GET List */}
              <div className="border rounded-md overflow-hidden bg-[#111]">
                <div className="flex items-center justify-between p-3 border-b bg-black/20">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      GET
                    </span>
                    <span className="font-mono text-xs text-[#a9b1d6]">/api/v1/{activeTab}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">List all {activeTab}</span>
                </div>
                <div className="p-3 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Query parameters: <code>limit</code> (default 50, max 100), <code>offset</code> (default 0).
                  </p>
                  {/* Code snippet */}
                  {(() => {
                    const curlCmd = `curl -X GET "${baseUrl}/api/v1/${activeTab}?limit=10"\n  -H "Authorization: Bearer ${activeKeyRaw}"`;
                    return (
                      <div className="relative group">
                        <pre className="p-3 bg-black/60 rounded border border-[#222] font-mono text-[11px] text-[#888] overflow-x-auto">
                          {curlCmd}
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(curlCmd, `get-list-${activeTab}`)}
                          className="absolute right-2 top-2 h-7 px-2 bg-[#111] opacity-0 group-hover:opacity-100 transition"
                        >
                          {copiedText === `get-list-${activeTab}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* POST Create */}
              <div className="border rounded-md overflow-hidden bg-[#111]">
                <div className="flex items-center justify-between p-3 border-b bg-black/20">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-400 border border-violet-800">
                      POST
                    </span>
                    <span className="font-mono text-xs text-[#a9b1d6]">/api/v1/{activeTab}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Create a new {activeTab.slice(0, -1)}</span>
                </div>
                <div className="p-3 space-y-4">
                  {/* Dynamic Request Example Builder */}
                  {(() => {
                    // Build mock payload
                    const payload: Record<string, any> = {};
                    if (activeTab === "companies") {
                      payload.name = "Acme Corp";
                      payload.domain = "acme.com";
                      payload.industry = "Technology";
                      payload.phone = "+1-555-0100";
                    } else if (activeTab === "contacts") {
                      payload.firstName = "John";
                      payload.lastName = "Doe";
                      payload.email = "john@doe.com";
                      payload.phone = "+1-555-0102";
                      payload.title = "Director of Operations";
                    } else if (activeTab === "leads") {
                      payload.title = "Enterprise Deal 2026";
                      payload.value = 50000;
                      payload.stageId = "stage_uuid_goes_here";
                    }

                    // Add Custom Fields structure
                    const targetFields = activeTab === "companies" 
                      ? companyCustomFields 
                      : activeTab === "contacts" 
                      ? contactCustomFields 
                      : leadCustomFields;

                    if (targetFields.length > 0) {
                      payload.customFields = {};
                      targetFields.forEach(f => {
                        payload.customFields[f.key] = getCustomFieldExample(f);
                      });
                    }

                    const curlCmd = `curl -X POST "${baseUrl}/api/v1/${activeTab}" \\\n  -H "Authorization: Bearer ${activeKeyRaw}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload, null, 2)}'`;
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-violet-400">
                          <Code className="h-3.5 w-3.5" />
                          Request Example & Payload Schema
                        </div>
                        <div className="relative group">
                          <pre className="p-3 bg-black/60 rounded border border-[#222] font-mono text-[11px] text-[#888] overflow-x-auto">
                            {curlCmd}
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(curlCmd, `create-${activeTab}`)}
                            className="absolute right-2 top-2 h-7 px-2 bg-[#111] opacity-0 group-hover:opacity-100 transition"
                          >
                            {copiedText === `create-${activeTab}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Dynamic Payload Tables */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#e5e5e5]">
                  <Info className="h-3.5 w-3.5 text-amber-500" />
                  Mô tả Schema trường dữ liệu (Schema Definitions)
                </div>
                
                <div className="border rounded-md overflow-hidden divide-y">
                  <div className="grid grid-cols-4 p-2.5 text-xs font-semibold bg-[#111] text-muted-foreground">
                    <div className="col-span-1">Field Key</div>
                    <div className="col-span-1">Type</div>
                    <div className="col-span-1">Required</div>
                    <div className="col-span-1">Origin</div>
                  </div>
                  
                  {/* Standard fields */}
                  {activeTab === "companies" && (
                    <>
                      <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                        <div className="col-span-1 font-mono text-white">name</div>
                        <div className="col-span-1">TEXT</div>
                        <div className="col-span-1 text-amber-500 font-semibold">Yes</div>
                        <div className="col-span-1 text-emerald-400">Standard</div>
                      </div>
                      <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                        <div className="col-span-1 font-mono text-white">domain</div>
                        <div className="col-span-1">TEXT</div>
                        <div className="col-span-1">No</div>
                        <div className="col-span-1 text-emerald-400">Standard</div>
                      </div>
                      <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                        <div className="col-span-1 font-mono text-white">industry</div>
                        <div className="col-span-1">TEXT</div>
                        <div className="col-span-1">No</div>
                        <div className="col-span-1 text-emerald-400">Standard</div>
                      </div>
                    </>
                  )}

                  {activeTab === "contacts" && (
                    <>
                      <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                        <div className="col-span-1 font-mono text-white">firstName</div>
                        <div className="col-span-1">TEXT</div>
                        <div className="col-span-1 text-amber-500 font-semibold">Yes</div>
                        <div className="col-span-1 text-emerald-400">Standard</div>
                      </div>
                      <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                        <div className="col-span-1 font-mono text-white">lastName</div>
                        <div className="col-span-1">TEXT</div>
                        <div className="col-span-1">No</div>
                        <div className="col-span-1 text-emerald-400">Standard</div>
                      </div>
                    </>
                  )}

                  {activeTab === "leads" && (
                    <>
                      <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                        <div className="col-span-1 font-mono text-white">title</div>
                        <div className="col-span-1">TEXT</div>
                        <div className="col-span-1 text-amber-500 font-semibold">Yes</div>
                        <div className="col-span-1 text-emerald-400">Standard</div>
                      </div>
                      <div className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground">
                        <div className="col-span-1 font-mono text-white">stageId</div>
                        <div className="col-span-1">TEXT</div>
                        <div className="col-span-1 text-amber-500 font-semibold">Yes</div>
                        <div className="col-span-1 text-emerald-400">Standard</div>
                      </div>
                    </>
                  )}

                  {/* Render Custom Fields dynamically */}
                  {(() => {
                    const fields = activeTab === "companies" 
                      ? companyCustomFields 
                      : activeTab === "contacts" 
                      ? contactCustomFields 
                      : leadCustomFields;

                    if (fields.length === 0) {
                      return (
                        <div className="p-3 text-xs text-center text-muted-foreground">
                          Không có custom fields nào được định nghĩa cho thực thể này.
                        </div>
                      );
                    }

                    return fields.map((f) => (
                      <div key={f.id} className="grid grid-cols-4 p-2.5 text-xs text-muted-foreground bg-[#1c1c1f]/20">
                        <div className="col-span-1 font-mono text-violet-300">customFields.{f.key}</div>
                        <div className="col-span-1 font-semibold">{f.fieldType}</div>
                        <div className="col-span-1">
                          {f.required ? <span className="text-amber-500 font-semibold">Yes</span> : "No"}
                        </div>
                        <div className="col-span-1 text-violet-400 font-semibold flex items-center gap-1.5">
                          Custom Field
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
