
"use client";
import { BarChart, LineChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ShiftDistributionChart from "@/components/admin/analytics/shift-distribution-chart";
import TaxiUtilizationChart from "@/components/admin/analytics/taxi-utilization-chart";
import ShiftsOverTimeChart from "@/components/admin/analytics/shifts-over-time-chart";


export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Visualize shift data and taxi utilization.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/>Shifts per Driver</CardTitle>
            <CardDescription>Distribution of booked shifts among drivers.</CardDescription>
          </CardHeader>
          <CardContent>
            <ShiftDistributionChart />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/>Taxi Utilization (Booked Hours)</CardTitle>
            <CardDescription>Total hours booked for each taxi.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaxiUtilizationChart />
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5 text-primary"/>Shifts Over Time</CardTitle>
            <CardDescription>Number of shifts booked per day in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ShiftsOverTimeChart />
          </CardContent>
        </Card>

    </div>
  );
}
