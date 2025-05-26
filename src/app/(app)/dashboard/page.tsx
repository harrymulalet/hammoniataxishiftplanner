
"use client";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AvailableTaxisList from '@/components/driver/available-taxis-list';
import MyShiftsTable from '@/components/driver/my-shifts-table';
import TaxiBookingModal from '@/components/driver/taxi-booking-modal';
import { useTranslation } from '@/hooks/useTranslation'; // Added
import { Loader2 } from 'lucide-react'; // Added


export default function DriverDashboardPage() {
  const { userProfile, isDriver, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation(); // Added

  useEffect(() => {
    if (!loading && !isDriver) {
      router.replace('/'); 
    }
  }, [loading, isDriver, router]);

  if (loading || !isDriver || !userProfile) { // Added !userProfile check
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" /> {/* Use Loader2 */}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('driverDashboardTitle')}
          </h1>
          <p className="text-muted-foreground">
            {t('driverDashboardWelcome', { firstName: userProfile.firstName })}
          </p>
        </div>
        <TaxiBookingModal />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{t('myUpcomingShifts')}</CardTitle>
              <CardDescription>{t('viewManageShifts')}</CardDescription>
            </CardHeader>
            <CardContent>
              <MyShiftsTable />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{t('availableTaxis')}</CardTitle>
              <CardDescription>{t('taxisCurrentlyAvailable')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AvailableTaxisList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    