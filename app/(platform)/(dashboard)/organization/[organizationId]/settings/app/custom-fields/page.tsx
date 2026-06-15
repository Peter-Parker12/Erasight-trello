import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { isOrgAdmin } from "@/lib/board-access";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { CustomFieldsManager } from "./_components/custom-fields-manager";

const ENTITY_TYPES = [
  { type: "COMPANY" as const, label: "Companies" },
  { type: "CONTACT" as const, label: "Contacts" },
  { type: "LEAD" as const, label: "Leads" },
];

type CustomFieldsSettingsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const CustomFieldsSettingsPage = async ({ params }: CustomFieldsSettingsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();
  if (!orgId) redirect("/select-org");

  if (!(await isOrgAdmin(orgId))) {
    redirect(`/organization/${organizationId}/settings/app/members`);
  }

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
