import { redirect } from "next/navigation";

type CustomFieldsSettingsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const CustomFieldsSettingsPage = async ({ params }: CustomFieldsSettingsPageProps) => {
  const { organizationId } = await params;
  redirect(`/organization/${organizationId}/crm/companies`);
};

export default CustomFieldsSettingsPage;
