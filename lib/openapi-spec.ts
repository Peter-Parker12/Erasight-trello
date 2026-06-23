import type { CrmEntityType, CustomFieldDefinition, CustomFieldType } from "@prisma/client";

import {
  COMPANY_STANDARD_FIELDS,
  CONTACT_STANDARD_FIELDS,
  LEAD_STANDARD_FIELDS,
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
    const entitySchema = buildEntitySchema(cfg, definitions);
    schemas[cfg.schemaName] = entitySchema;

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
        description: `Creates a new ${cfg.singularLabel} record. Standard fields and organization custom fields are validated against the current schema.`,
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
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: `The ${cfg.singularLabel}.`,
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
          "404": { description: "Not found." },
        },
      },
      patch: {
        summary: `Update a ${cfg.singularLabel}`,
        security,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
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
                  properties: {
                    data: { $ref: `#/components/schemas/${cfg.schemaName}` },
                  },
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
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": { description: `Deleted.` },
          "401": { description: "Unauthorized." },
          "404": { description: "Not found." },
        },
      },
    };
  }

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
