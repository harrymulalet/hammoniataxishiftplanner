
"use client";
import { BarChart, LineChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ShiftDistributionChart from "@/components/admin/analytics/shift-distribution-chart";
import TaxiUtilizationChart from "@/components/admin/analytics/taxi-utilization-chart";
import ShiftsOverTimeChart from "@/components/admin/analytics/shifts-over-time-chart";
import { useTranslation } from "@/hooks/useTranslation"; // Added


export default function AnalyticsPage() {
  const { t } = useTranslation(); // Added

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('analyticsDashboard')}
        </h1>
        <p className="text-muted-foreground">
          {t('analyticsDashboardSubtitle')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/>{t('shiftsPerDriver')}</CardTitle>
            <CardDescription>{t('shiftsPerDriverDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ShiftDistributionChart />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/>{t('taxiUtilization')}</CardTitle>
            <CardDescription>{t('taxiUtilizationDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <TaxiUtilizationChart />
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5 text-primary"/>{t('shiftsOverTime')}</CardTitle>
            <CardDescription>{t('shiftsOverTimeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ShiftsOverTimeChart />
          </CardContent>
        </Card>

    </div>
  );
}
