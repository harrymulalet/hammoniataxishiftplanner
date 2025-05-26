
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AllShiftsView from "@/components/admin/all-shifts-view";

export default function ManageAllShiftsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          All Shifts Overview
        </h1>
        <p className="text-muted-foreground">
          View and manage all booked shifts across all drivers and taxis.
        </p>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Booked Shifts</CardTitle>
          <CardDescription>A comprehensive list of all shifts in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <AllShiftsView />
        </CardContent>
      </Card>
    </div>
  );
}
