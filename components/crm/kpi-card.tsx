import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
};

export const KpiCard = ({ label, value, icon: Icon, iconColor = "text-violet-400", trend, trendUp }: KpiCardProps) => (
  <div className="bg-[#1f1f1f] border border-[#333] rounded-lg p-4 flex items-start gap-3">
    <div className="p-2 rounded-md bg-violet-600/10 shrink-0">
      <Icon className={cn("h-5 w-5", iconColor)} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-[#e5e5e5] mt-0.5">{value}</p>
      {trend && (
        <p className={cn("text-xs mt-0.5", trendUp ? "text-green-400" : "text-muted-foreground")}>
          {trend}
        </p>
      )}
    </div>
  </div>
);
