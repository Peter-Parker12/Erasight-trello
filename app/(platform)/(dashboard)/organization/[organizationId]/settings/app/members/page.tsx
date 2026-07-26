import { OrganizationProfile } from "@clerk/nextjs";

const MembersSettingsPage = () => {
  return (
    <div className="w-full py-4">
      <OrganizationProfile
        appearance={{
          elements: {
            // Local layout tweak to fill the settings page width — colors and
            // surfaces come from the root ClerkProvider's clerkAppearance cascade.
            rootBox: { boxShadow: "none", width: "100%" },
            card: { boxShadow: "none", width: "100%" },
          },
        }}
      />
    </div>
  );
};

export default MembersSettingsPage;
