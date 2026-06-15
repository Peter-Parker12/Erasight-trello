import { OrganizationProfile } from "@clerk/nextjs";

const MembersSettingsPage = () => {
  return (
    <div className="w-full py-4">
      <OrganizationProfile
        appearance={{
          elements: {
            rootBox: {
              boxShadow: "none",
              width: "100%",
            },
            card: {
              border: "1px solid #e5e5e5",
              boxShadow: "none",
              width: "100%",
            },
          },
        }}
      />
    </div>
  );
};

export default MembersSettingsPage;
