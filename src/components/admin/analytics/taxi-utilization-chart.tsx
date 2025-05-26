
"use client";

import { collection, query, onSnapshot, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

import { db } from "@/lib/firebase";
import type { Shift, Taxi } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";


interface ChartData {
  taxiPlate: string;
  hours: number;
  fill?: string;
}

const chartConfig = {
  hours: {
    label: "Hours Booked",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function TaxiUtilizationChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const taxisSnapshot = await getDocs(collection(db, "taxis"));
        const taxis = taxisSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Taxi));
        
        const shiftsSnapshot = await getDocs(collection(db, "shifts"));
        const shifts = shiftsSnapshot.docs.map(doc => doc.data() as Shift);

        const data: ChartData[] = taxis.map(taxi => {
          const taxiShifts = shifts.filter(shift => shift.taxiId === taxi.id);
          const totalHours = taxiShifts.reduce((acc, shift) => {
            const durationMillis = shift.endTime.toMillis() - shift.startTime.toMillis();
            return acc + (durationMillis / (1000 * 60 * 60)); // convert ms to hours
          }, 0);
          return {
            taxiPlate: taxi.licensePlate,
            hours: Math.round(totalHours * 10) / 10, // round to 1 decimal place
          };
        }).sort((a,b) => b.hours - a.hours);

        setChartData(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load taxi utilization data." });
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
    return <p className="text-center text-muted-foreground py-10 h-72">No taxi utilization data available.</p>;
  }
  
  const accessibleChartData = chartData.map(item => ({ ...item, fill: chartConfig.hours.color }));

  return (
    <div className="h-72 w-full">
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <RechartsBarChart accessibilityLayer data={accessibleChartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="taxiPlate" tickLine={false} axisLine={false} tick={{fontSize: 10}} interval={0} angle={-30} textAnchor="end" height={50} />
          <YAxis dataKey="hours" />
          <ChartTooltipContent />
          <Legend />
          <Bar dataKey="hours" radius={4} />
        </RechartsBarChart>
      </ChartContainer>
    </div>
  );
}
