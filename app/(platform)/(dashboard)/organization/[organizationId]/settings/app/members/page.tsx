import { OrganizationProfile } from "@clerk/nextjs";

const MembersSettingsPage = () => {
  return (
    <div className="w-full py-4">
      <OrganizationProfile
        appearance={{
          variables: {
            colorBackground: "#1f1f1f",
            colorText: "#e5e5e5",
            colorTextSecondary: "#888888",
            colorPrimary: "#7c3aed",
            colorInputBackground: "#2a2a2a",
            colorInputText: "#e5e5e5",
            colorNeutral: "#888888",
            colorShimmer: "#2a2a2a",
          },
          elements: {
            rootBox: { boxShadow: "none", width: "100%" },
            card: { backgroundColor: "#1f1f1f", border: "1px solid #333", boxShadow: "none", width: "100%" },
            navbar: { backgroundColor: "#171717", borderRight: "1px solid #333" },
            navbarButton: { color: "#888" },
            pageScrollBox: { backgroundColor: "#1f1f1f" },
            formFieldInput: { backgroundColor: "#2a2a2a", borderColor: "#333", color: "#e5e5e5" },
            formFieldLabel: { color: "#888" },
            headerTitle: { color: "#e5e5e5" },
            headerSubtitle: { color: "#888" },
            dividerLine: { backgroundColor: "#333" },
            profileSectionTitle: { borderBottom: "1px solid #333" },
            profileSectionTitleText: { color: "#e5e5e5" },
            profileSectionContent: { color: "#e5e5e5" },
            tableHead: { backgroundColor: "#2a2a2a" },
            badge: { backgroundColor: "#333", color: "#888" },
          },
        }}
      />
    </div>
  );
};

export default MembersSettingsPage;
