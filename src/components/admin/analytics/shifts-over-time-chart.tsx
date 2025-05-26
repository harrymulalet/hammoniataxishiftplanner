
"use client";

import { collection, query, onSnapshot, getDocs, Timestamp, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";

import { db } from "@/lib/firebase";
import type { Shift } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useTranslation } from "@/hooks/useTranslation"; // Added

interface ChartData {
  date: string; // YYYY-MM-DD
  shifts: number;
}


export default function ShiftsOverTimeChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation(); // Added

  const chartConfig = { // Moved inside component to use t()
    shifts: {
      label: t('shiftsLabel'),
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const shiftsSnapshot = await getDocs(
          query(
            collection(db, "shifts"),
            where("startTime", ">=", Timestamp.fromDate(thirtyDaysAgo))
          )
        );
        const shifts = shiftsSnapshot.docs.map(doc => doc.data() as Shift);

        const dateRange = eachDayOfInterval({
          start: thirtyDaysAgo,
          end: new Date(),
        });

        const data: ChartData[] = dateRange.map(date => {
          const dateString = format(date, "yyyy-MM-dd");
          const shiftsOnDate = shifts.filter(shift => 
            format(shift.startTime.toDate(), "yyyy-MM-dd") === dateString
          ).length;
          return {
            date: format(date, "MMM d"), 
            shifts: shiftsOnDate,
          };
        });

        setChartData(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        toast({ variant: "destructive", title: t('error'), description: "Could not load shifts over time data." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast, t]); // Added t to dependencies

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-72">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return <p className="text-center text-muted-foreground py-10 h-72">{t('noRecentShiftDataForChart')}</p>;
  }
  

  return (
    <div className="h-72 w-full">
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <RechartsLineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{fontSize: 12}}
          />
          <YAxis dataKey="shifts" allowDecimals={false} />
          <ChartTooltipContent />
          <Legend />
          <Line type="monotone" dataKey="shifts" stroke={chartConfig.shifts.color} strokeWidth={2} dot={false} />
        </RechartsLineChart>
      </ChartContainer>
    </div>
  );
}
