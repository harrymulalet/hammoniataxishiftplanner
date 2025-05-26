
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DriverManagementTable from "@/components/admin/driver-management-table";
import AddDriverModal from "@/components/admin/driver-form-modal"; // Will create this for adding drivers

export default function ManageDriversPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Driver Management
          </h1>
          <p className="text-muted-foreground">
            Create, view, and manage driver accounts.
          </p>
        </div>
        <AddDriverModal />
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
          <CardDescription>A list of all registered drivers in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <DriverManagementTable />
        </CardContent>
      </Card>
    </div>
  );
}
