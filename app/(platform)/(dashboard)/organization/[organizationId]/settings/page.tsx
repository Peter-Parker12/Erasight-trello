import { redirect } from "next/navigation";

type SettingsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const SettingsPage = async ({ params }: SettingsPageProps) => {
  const { organizationId } = await params;
  redirect(`/organization/${organizationId}/settings/app`);
};

export default SettingsPage;
