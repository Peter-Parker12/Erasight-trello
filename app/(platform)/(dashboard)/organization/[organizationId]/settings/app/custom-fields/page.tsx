import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { CustomFieldsManager } from "./_components/custom-fields-manager";

const ENTITY_TYPES = [
  { type: "COMPANY" as const, label: "Companies" },
  { type: "CONTACT" as const, label: "Contacts" },
  { type: "LEAD" as const, label: "Leads" },
];

const CustomFieldsSettingsPage = async () => {
  const { orgId } = await auth();
  if (!orgId) redirect("/select-org");

  const definitions = await Promise.all(
    ENTITY_TYPES.map(async ({ type }) => ({
      type,
      fields: (await getFieldDefinitions(orgId, type)).map(toFieldDefinitionDTO),
    }))
  );

  return (
    <div className="space-y-4 py-4">
      {ENTITY_TYPES.map(({ type, label }, index) => (
        <CustomFieldsManager
          key={type}
          entityType={type}
          label={label}
          fields={definitions[index].fields}
        />
      ))}
    </div>
  );
};

export default CustomFieldsSettingsPage;
