
"use client"; // Added for useTranslation hook

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TaxiManagementTable from "@/components/admin/taxi-management-table";
import AddTaxiModal from "@/components/admin/taxi-form-modal";
import { useTranslation } from "@/hooks/useTranslation"; // Added

export default function ManageTaxisPage() {
  const { t } = useTranslation(); // Added

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('taxiManagement')}
          </h1>
          <p className="text-muted-foreground">
            {t('taxiManagementSubtitle')}
          </p>
        </div>
        <AddTaxiModal />
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('allTaxis')}</CardTitle>
          <CardDescription>{t('allTaxisDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <TaxiManagementTable />
        </CardContent>
      </Card>
    </div>
  );
}
