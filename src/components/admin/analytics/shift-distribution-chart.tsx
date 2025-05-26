
"use client";

import { collection, query, onSnapshot, getDocs, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

import { db } from "@/lib/firebase";
import type { Shift, UserProfile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface ChartData {
  driverName: string;
  shifts: number;
  fill?: string; // for chart color
}

const chartConfig = {
  shifts: {
    label: "Shifts Booked",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;


export default function ShiftDistributionChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const driversSnapshot = await getDocs(query(collection(db, "users"), where("role", "==", "driver")));
        const drivers = driversSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        
        const shiftsSnapshot = await getDocs(collection(db, "shifts"));
        const shifts = shiftsSnapshot.docs.map(doc => doc.data() as Shift);

        const data: ChartData[] = drivers.map(driver => {
          const driverShifts = shifts.filter(shift => shift.driverId === driver.uid).length;
          return {
            driverName: `${driver.firstName} ${driver.lastName}`,
            shifts: driverShifts,
          };
        }).sort((a,b) => b.shifts - a.shifts); // Sort by most shifts

        setChartData(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load shift distribution data." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-72">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return <p className="text-center text-muted-foreground py-10 h-72">No shift data available to display.</p>;
  }
  
  const accessibleChartData = chartData.map(item => ({ ...item, fill: chartConfig.shifts.color }));


  return (
    <div className="h-72 w-full">
     <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <RechartsBarChart accessibilityLayer data={accessibleChartData} layout="vertical" margin={{ right: 20 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" dataKey="shifts" />
          <YAxis 
            dataKey="driverName" 
            type="category" 
            tickLine={false} 
            axisLine={false} 
            width={120}
            tick={{fontSize: 12}}
            />
          <ChartTooltipContent />
          <Legend />
          <Bar dataKey="shifts" radius={4} />
        </RechartsBarChart>
      </ChartContainer>
    </div>
  );
}
