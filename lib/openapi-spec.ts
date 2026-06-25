import type { CrmEntityType, CustomFieldDefinition, CustomFieldType } from "@prisma/client";

import {
  COMPANY_STANDARD_FIELDS,
  CONTACT_STANDARD_FIELDS,
  LEAD_STANDARD_FIELDS,
  PRODUCT_STANDARD_FIELDS,
  BUNDLE_STANDARD_FIELDS,
  PIPELINE_STAGE_STANDARD_FIELDS,
  CUSTOM_FIELD_DEFINITION_STANDARD_FIELDS,
  BOARD_STANDARD_FIELDS,
  LIST_STANDARD_FIELDS,
  CARD_STANDARD_FIELDS,
  COMMENT_STANDARD_FIELDS,
  ATTACHMENT_STANDARD_FIELDS,
  CHECKLIST_STANDARD_FIELDS,
  CHECKLIST_ITEM_STANDARD_FIELDS,
  LABEL_STANDARD_FIELDS,
  type StandardFieldDTO,
} from "@/lib/api-v1-schema";
import { getFieldDefinitions, type CustomFieldOptions } from "@/lib/custom-fields";

// Mapping from CustomFieldType → JSON Schema fragment used in OpenAPI schemas.
const jsonSchemaForType = (
  type: CustomFieldType,
  options: string[] = []
): Record<string, unknown> => {
  switch (type) {
    case "TEXT":
    case "PHONE":
      return { type: "string" };
    case "EMAIL":
      return { type: "string", format: "email" };
    case "URL":
      return { type: "string", format: "uri" };
    case "NUMBER":
    case "CURRENCY":
      return { type: "number" };
    case "BOOLEAN":
      return { type: "boolean" };
    case "DATE":
      return { type: "string", format: "date" };
    case "SELECT":
      return options.length > 0
        ? { type: "string", enum: options }
        : { type: "string" };
    case "MULTI_SELECT":
      return {
        type: "array",
        items:
          options.length > 0
            ? { type: "string", enum: options }
            : { type: "string" },
      };
    default:
      return { type: "string" };
  }
};

// Standard field types in api-v1-schema use the same string literals as
// CustomFieldType, plus a few free-form strings (e.g. "TEXT"). Re-use the
// same mapping for consistency.
const jsonSchemaForStandardField = (field: StandardFieldDTO): Record<string, unknown> => {
  const base = jsonSchemaForType(field.type as CustomFieldType);
  return field.required ? base : { ...base, nullable: true };
};

type EntityConfig = {
  pathSegment: string; // URL segment, e.g. "companies"
  schemaName: string; // Schema component name, e.g. "Company"
  entityType: CrmEntityType;
  standardFields: StandardFieldDTO[];
  singularLabel: string;
};

const ENTITY_CONFIGS: EntityConfig[] = [
  {
    pathSegment: "companies",
    schemaName: "Company",
    entityType: "COMPANY",
    standardFields: COMPANY_STANDARD_FIELDS,
    singularLabel: "company",
  },
  {
    pathSegment: "contacts",
    schemaName: "Contact",
    entityType: "CONTACT",
    standardFields: CONTACT_STANDARD_FIELDS,
    singularLabel: "contact",
  },
  {
    pathSegment: "leads",
    schemaName: "Lead",
    entityType: "LEAD",
    standardFields: LEAD_STANDARD_FIELDS,
    singularLabel: "lead",
  },
];

// Plain (non-CRM) resource configs. These do not have dynamic custom fields;
// their schema is fully described by `standardFields`.
type ResourceConfig = {
  pathSegment: string;
  schemaName: string;
  singularLabel: string;
  standardFields: StandardFieldDTO[];
};

const RESOURCE_CONFIGS: ResourceConfig[] = [
  {
    pathSegment: "products",
    schemaName: "Product",
    singularLabel: "product",
    standardFields: PRODUCT_STANDARD_FIELDS,
  },
  {
    pathSegment: "bundles",
    schemaName: "ProductBundle",
    singularLabel: "product bundle",
    standardFields: BUNDLE_STANDARD_FIELDS,
  },
  {
    pathSegment: "pipeline-stages",
    schemaName: "PipelineStage",
    singularLabel: "pipeline stage",
    standardFields: PIPELINE_STAGE_STANDARD_FIELDS,
  },
  {
    pathSegment: "custom-fields",
    schemaName: "CustomFieldDefinition",
    singularLabel: "custom field definition",
    standardFields: CUSTOM_FIELD_DEFINITION_STANDARD_FIELDS,
  },
  {
    pathSegment: "boards",
    schemaName: "Board",
    singularLabel: "board",
    standardFields: BOARD_STANDARD_FIELDS,
  },
  {
    pathSegment: "lists",
    schemaName: "List",
    singularLabel: "list",
    standardFields: LIST_STANDARD_FIELDS,
  },
  {
    pathSegment: "cards",
    schemaName: "Card",
    singularLabel: "card",
    standardFields: CARD_STANDARD_FIELDS,
  },
  {
    pathSegment: "comments",
    schemaName: "Comment",
    singularLabel: "comment",
    standardFields: COMMENT_STANDARD_FIELDS,
  },
  {
    pathSegment: "attachments",
    schemaName: "Attachment",
    singularLabel: "attachment",
    standardFields: ATTACHMENT_STANDARD_FIELDS,
  },
  {
    pathSegment: "checklists",
    schemaName: "Checklist",
    singularLabel: "checklist",
    standardFields: CHECKLIST_STANDARD_FIELDS,
  },
  {
    pathSegment: "checklist-items",
    schemaName: "ChecklistItem",
    singularLabel: "checklist item",
    standardFields: CHECKLIST_ITEM_STANDARD_FIELDS,
  },
  {
    pathSegment: "labels",
    schemaName: "Label",
    singularLabel: "label",
    standardFields: LABEL_STANDARD_FIELDS,
  },
];

const extractOptions = (def: CustomFieldDefinition): string[] =>
  (def.options as CustomFieldOptions | null)?.options ?? [];

const buildEntitySchema = (cfg: EntityConfig, defs: CustomFieldDefinition[]) => {
  const properties: Record<string, unknown> = {
    id: { type: "string", format: "uuid", readOnly: true },
    orgId: { type: "string", format: "uuid", readOnly: true },
    createdAt: { type: "string", format: "date-time", readOnly: true },
    updatedAt: { type: "string", format: "date-time", readOnly: true },
  };

  const required: string[] = [];

  for (const field of cfg.standardFields) {
    properties[field.key] = {
      ...jsonSchemaForStandardField(field),
      description: field.label,
    };
    if (field.required) required.push(field.key);
  }

  // customFields is always present as an object (possibly empty).
  const customFieldProperties: Record<string, unknown> = {};
  for (const def of defs) {
    const schema = jsonSchemaForType(def.fieldType, extractOptions(def));
    customFieldProperties[def.key] = def.required
      ? schema
      : { ...schema, nullable: true };
    if (def.required) required.push("customFields");
  }
  properties.customFields = {
    type: "object",
    description: "Organization-specific custom fields. Keys map to CustomFieldDefinition.key.",
    properties: customFieldProperties,
    additionalProperties: true,
  };

  return {
    type: "object",
    required,
    properties,
  };
};

const buildResourceSchema = (cfg: ResourceConfig) => {
  const properties: Record<string, unknown> = {
    id: { type: "string", format: "uuid", readOnly: true },
    createdAt: { type: "string", format: "date-time", readOnly: true },
    updatedAt: { type: "string", format: "date-time", readOnly: true },
  };
  // Boards/lists/etc are org-scoped via parent chain; expose orgId on the
  // CRM-style resources that already had it before. For board/list/card
  // resources there is no orgId column, so omit it.
  if (
    cfg.pathSegment === "products" ||
    cfg.pathSegment === "bundles" ||
    cfg.pathSegment === "pipeline-stages" ||
    cfg.pathSegment === "custom-fields"
  ) {
    properties.orgId = { type: "string", format: "uuid", readOnly: true };
  }

  const required: string[] = [];
  for (const field of cfg.standardFields) {
    properties[field.key] = {
      ...jsonSchemaForStandardField(field),
      description: field.label,
    };
    if (field.required) required.push(field.key);
  }

  return { type: "object", required, properties };
};

const buildCrudPaths = (
  cfg: { pathSegment: string; schemaName: string; singularLabel: string },
  paths: Record<string, Record<string, unknown>>
) => {
  const collectionPath = `/api/v1/${cfg.pathSegment}`;
  const itemPath = `/api/v1/${cfg.pathSegment}/{id}`;
  const security = [{ BearerAuth: [] }];

  paths[collectionPath] = {
    get: {
      summary: `List ${cfg.pathSegment}`,
      description: `Returns a paginated list of ${cfg.pathSegment} for the authenticated organization.`,
      security,
      parameters: [
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", default: 50, minimum: 1, maximum: 100 },
        },
        {
          name: "offset",
          in: "query",
          required: false,
          schema: { type: "integer", default: 0, minimum: 0 },
        },
      ],
      responses: {
        "200": {
          description: "A paginated list of records.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: { $ref: `#/components/schemas/${cfg.schemaName}` },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      limit: { type: "integer" },
                      offset: { type: "integer" },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
        "401": { description: "Unauthorized." },
      },
    },
    post: {
      summary: `Create a ${cfg.singularLabel}`,
      description: `Creates a new ${cfg.singularLabel} record.`,
      security,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${cfg.schemaName}` },
          },
        },
      },
      responses: {
        "201": {
          description: `The created ${cfg.singularLabel}.`,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: { $ref: `#/components/schemas/${cfg.schemaName}` },
                },
              },
            },
          },
        },
        "401": { description: "Unauthorized." },
        "422": { description: "Validation failed." },
      },
    },
  };

  paths[itemPath] = {
    get: {
      summary: `Get a ${cfg.singularLabel} by ID`,
      security,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": {
          description: `The ${cfg.singularLabel}.`,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { data: { $ref: `#/components/schemas/${cfg.schemaName}` } },
              },
            },
          },
        },
        "401": { description: "Unauthorized." },
        "404": { description: "Not found." },
      },
    },
    patch: {
      summary: `Update a ${cfg.singularLabel}`,
      security,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${cfg.schemaName}` },
          },
        },
      },
      responses: {
        "200": {
          description: `The updated ${cfg.singularLabel}.`,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { data: { $ref: `#/components/schemas/${cfg.schemaName}` } },
              },
            },
          },
        },
        "401": { description: "Unauthorized." },
        "404": { description: "Not found." },
        "422": { description: "Validation failed." },
      },
    },
    delete: {
      summary: `Delete a ${cfg.singularLabel}`,
      security,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "204": { description: `Deleted.` },
        "401": { description: "Unauthorized." },
        "404": { description: "Not found." },
      },
    },
  };
};

// Specialized action paths (move/reorder/watch/enrich/etc). These are simple
// POST endpoints under `/api/v1/{resource}/{id}/{action}`.
type ActionSpec = {
  path: string;
  summary: string;
  description: string;
  requestBodySchema?: Record<string, unknown>;
};

const ACTION_SPECS: ActionSpec[] = [
  {
    path: "/api/v1/cards/{id}/move",
    summary: "Move card to another list",
    description: "Moves a card to a different list and updates its order.",
    requestBodySchema: {
      type: "object",
      properties: {
        targetListId: { type: "string", format: "uuid" },
        order: { type: "integer" },
      },
      required: ["targetListId"],
    },
  },
  {
    path: "/api/v1/cards/{id}/reorder",
    summary: "Reorder card within its list",
    description: "Updates the order of a card within its current list.",
    requestBodySchema: {
      type: "object",
      properties: { order: { type: "integer" } },
      required: ["order"],
    },
  },
  {
    path: "/api/v1/cards/{id}/watch",
    summary: "Toggle card watch state",
    description: "Toggles the requesting API key's user as watcher of the card. Since API keys are not user-bound the watch action is best-effort.",
    requestBodySchema: {
      type: "object",
      properties: { watch: { type: "boolean" } },
    },
  },
  {
    path: "/api/v1/leads/{id}/move",
    summary: "Move lead to pipeline stage",
    description: "Moves one or more leads to a different pipeline stage and updates their order.",
    requestBodySchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              stageId: { type: "string", format: "uuid" },
              order: { type: "integer" },
            },
            required: ["id", "stageId"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    path: "/api/v1/leads/{id}/products",
    summary: "Replace lead products",
    description: "Replaces the set of products associated with a lead with the provided list.",
    requestBodySchema: {
      type: "object",
      properties: { productIds: { type: "array", items: { type: "string", format: "uuid" } } },
      required: ["productIds"],
    },
  },
  {
    path: "/api/v1/companies/{id}/enrich",
    summary: "Enrich company data",
    description: "Runs the configured enrichment provider against the company's domain and stores the result.",
    requestBodySchema: {
      type: "object",
      properties: { overrideMode: { type: "string", enum: ["SKIP_FILLED", "OVERWRITE"] } },
    },
  },
  {
    path: "/api/v1/companies/{id}/assign-bundle",
    summary: "Assign product bundle to company",
    description: "Associates a product bundle with a company.",
    requestBodySchema: {
      type: "object",
      properties: { bundleId: { type: "string", format: "uuid" } },
      required: ["bundleId"],
    },
  },
];

const buildActionPaths = (paths: Record<string, Record<string, unknown>>) => {
  const security = [{ BearerAuth: [] }];
  for (const spec of ACTION_SPECS) {
    paths[spec.path] = {
      post: {
        summary: spec.summary,
        description: spec.description,
        security,
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        ...(spec.requestBodySchema
          ? {
              requestBody: {
                required: true,
                content: {
                  "application/json": { schema: spec.requestBodySchema },
                },
              },
            }
          : {}),
        responses: {
          "200": { description: "Action completed." },
          "401": { description: "Unauthorized." },
          "404": { description: "Not found." },
          "422": { description: "Validation failed." },
        },
      },
    };
  }
};

export type OpenAPIDocument = {
  openapi: string;
  info: Record<string, unknown>;
  servers: { url: string }[];
  paths: Record<string, Record<string, unknown>>;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes: Record<string, unknown>;
  };
};

export const buildOpenApiSpec = async (
  orgId: string,
  baseUrl = ""
): Promise<OpenAPIDocument> => {
  const paths: Record<string, Record<string, unknown>> = {};
  const schemas: Record<string, unknown> = {};

  for (const cfg of ENTITY_CONFIGS) {
    const definitions = await getFieldDefinitions(orgId, cfg.entityType);
    schemas[cfg.schemaName] = buildEntitySchema(cfg, definitions);
    buildCrudPaths(cfg, paths);
  }

  for (const cfg of RESOURCE_CONFIGS) {
    schemas[cfg.schemaName] = buildResourceSchema(cfg);
    buildCrudPaths(cfg, paths);
  }

  buildActionPaths(paths);

  return {
    openapi: "3.0.3",
    info: {
      title: "Erasight CRM API",
      version: "1.0.0",
      description:
        "REST API for Erasight CRM. This schema is generated dynamically per organization and reflects the current set of standard and custom fields. Custom fields added or removed at runtime will appear in subsequent requests without a server restart.",
    },
    servers: [{ url: `${baseUrl}/api/v1` }],
    paths,
    components: {
      schemas,
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Use 'Authorization: Bearer <api_key>'.",
        },
      },
    },
  };
};

// Exposed for UI consumers that want to render the catalog without fetching
// the OpenAPI document.
export const RESOURCE_CATALOG = [
  ...ENTITY_CONFIGS.map((cfg) => ({
    kind: "crm" as const,
    pathSegment: cfg.pathSegment,
    schemaName: cfg.schemaName,
    singularLabel: cfg.singularLabel,
    standardFields: cfg.standardFields,
    entityType: cfg.entityType,
  })),
  ...RESOURCE_CONFIGS.map((cfg) => ({
    kind: "resource" as const,
    pathSegment: cfg.pathSegment,
    schemaName: cfg.schemaName,
    singularLabel: cfg.singularLabel,
    standardFields: cfg.standardFields,
  })),
];

export const ACTION_CATALOG = ACTION_SPECS;
