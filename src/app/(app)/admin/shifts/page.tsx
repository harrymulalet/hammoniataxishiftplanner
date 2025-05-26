
"use client"; // Added for useTranslation hook

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AllShiftsView from "@/components/admin/all-shifts-view";
import { useTranslation } from "@/hooks/useTranslation"; // Added

export default function ManageAllShiftsPage() {
  const { t } = useTranslation(); // Added

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('allShiftsOverview')}
        </h1>
        <p className="text-muted-foreground">
          {t('allShiftsOverviewSubtitle')}
        </p>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('bookedShifts')}</CardTitle>
          <CardDescription>{t('bookedShiftsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <AllShiftsView />
        </CardContent>
      </Card>
    </div>
  );
}
