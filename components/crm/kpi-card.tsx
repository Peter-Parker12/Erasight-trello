import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
};

export const KpiCard = ({ label, value, icon: Icon, iconColor = "text-primary", trend, trendUp }: KpiCardProps) => (
  <Card>
    <CardContent className="p-4 flex items-start gap-3">
      <div className="p-2 rounded-md bg-primary/10 shrink-0">
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-card-foreground mt-0.5">{value}</p>
        {trend && (
          <p className={cn("text-xs mt-0.5", trendUp ? "text-green-400" : "text-muted-foreground")}>
            {trend}
          </p>
        )}
      </div>
    </CardContent>
  </Card>
);
