
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DriverManagementTable from "@/components/admin/driver-management-table";
import AddDriverModal from "@/components/admin/driver-form-modal"; 
import { useTranslation } from "@/hooks/useTranslation";

export default function ManageDriversPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('driverManagement')}
          </h1>
          <p className="text-muted-foreground">
            {t('driverManagementSubtitle')}
          </p>
        </div>
        <AddDriverModal />
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('allDrivers')}</CardTitle>
          <CardDescription>{t('allDriversDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DriverManagementTable />
        </CardContent>
      </Card>
    </div>
  );
}

    