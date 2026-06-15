import { MODULE_KEYS, MODULE_REGISTRY } from "@/lib/modules";
import { ModuleAccessPanel } from "./_components/module-access-panel";

const ModulesSettingsPage = () => {
  return (
    <div className="space-y-4 py-4">
      {MODULE_KEYS.map((key) => (
        <ModuleAccessPanel
          key={key}
          moduleKey={key}
          label={MODULE_REGISTRY[key].label}
          description={MODULE_REGISTRY[key].description}
          defaultAccess={MODULE_REGISTRY[key].defaultAccess}
        />
      ))}
    </div>
  );
};

export default ModulesSettingsPage;
