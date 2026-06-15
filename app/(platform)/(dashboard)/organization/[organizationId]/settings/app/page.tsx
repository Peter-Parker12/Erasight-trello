import { redirect } from "next/navigation";

type AppSettingsIndexPageProps = {
  params: Promise<{ organizationId: string }>;
};

const AppSettingsIndexPage = async ({ params }: AppSettingsIndexPageProps) => {
  const { organizationId } = await params;
  redirect(`/organization/${organizationId}/settings/app/modules`);
};

export default AppSettingsIndexPage;
