
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TaxiManagementTable from "@/components/admin/taxi-management-table";
import AddTaxiModal from "@/components/admin/taxi-form-modal";

export default function ManageTaxisPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Taxi Management
          </h1>
          <p className="text-muted-foreground">
            Add, view, and manage taxi vehicles.
          </p>
        </div>
        <AddTaxiModal />
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Taxis</CardTitle>
          <CardDescription>A list of all registered taxis in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaxiManagementTable />
        </CardContent>
      </Card>
    </div>
  );
}
