
"use client";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AvailableTaxisList from '@/components/driver/available-taxis-list';
import MyShiftsTable from '@/components/driver/my-shifts-table';
import TaxiBookingModal from '@/components/driver/taxi-booking-modal';


export default function DriverDashboardPage() {
  const { userProfile, isDriver, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isDriver) {
      // If not a driver or loading, redirect or show error
      // This could be a redirect to login or an unauthorized page
      router.replace('/'); 
    }
  }, [loading, isDriver, router]);

  if (loading || !isDriver) {
    return <div className="flex h-screen items-center justify-center"><p>Loading driver dashboard...</p></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Driver Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome, {userProfile?.firstName}! Manage your shifts and bookings here.
          </p>
        </div>
        <TaxiBookingModal />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>My Upcoming Shifts</CardTitle>
              <CardDescription>View and manage your scheduled shifts.</CardDescription>
            </CardHeader>
            <CardContent>
              <MyShiftsTable />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Available Taxis</CardTitle>
              <CardDescription>Taxis currently available for booking.</CardDescription>
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
