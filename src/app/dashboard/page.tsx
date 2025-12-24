import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, DollarSign, Activity } from "lucide-react";

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Active Loads"
          value="12"
          icon={<Truck className="h-4 w-4 text-blue-600" />}
        />
        <KPICard
          title="Revenue (MTD)"
          value="$45,231"
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
        />
        <KPICard
          title="On-Time Rate"
          value="98.5%"
          icon={<Activity className="h-4 w-4 text-orange-600" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              No shipments found. (We will connect this to API next)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
