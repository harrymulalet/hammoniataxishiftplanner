
"use client";

import { collection, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Loader2, Edit3, Trash2, Car, Power, PowerOff } from "lucide-react";

import { db } from "@/lib/firebase";
import type { Taxi } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import AddTaxiModal from "./taxi-form-modal"; // Re-use for editing
import { Badge } from "@/components/ui/badge";


export default function TaxiManagementTable() {
  const { userProfile: adminProfile, loading: authLoading } = useAuth();
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTaxi, setEditingTaxi] = useState<Taxi | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
     if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!adminProfile || adminProfile.role !== 'admin') {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    const taxisRef = collection(db, "taxis");
    const q = query(taxisRef, orderBy("licensePlate", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const taxisData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Taxi));
      setTaxis(taxisData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching taxis:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load taxi data." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [adminProfile, authLoading, toast]);

  const handleDeleteTaxi = async (taxiId: string) => {
    // Consider implications: what happens to shifts booked for this taxi?
    // For now, simple delete.
    try {
      await deleteDoc(doc(db, "taxis", taxiId));
      toast({ title: "Success", description: "Taxi deleted successfully." });
    } catch (error) {
      console.error("Error deleting taxi:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete taxi." });
    }
  };

  const handleToggleActive = async (taxi: Taxi) => {
    const taxiRef = doc(db, "taxis", taxi.id);
    try {
      await updateDoc(taxiRef, { isActive: !taxi.isActive });
      toast({ title: "Success", description: `Taxi ${taxi.licensePlate} ${!taxi.isActive ? 'activated' : 'deactivated'}.` });
    } catch (error) {
      console.error("Error updating taxi status:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update taxi status." });
    }
  };
  
  const handleEditTaxi = (taxi: Taxi) => {
    setEditingTaxi(taxi);
    setIsEditModalOpen(true);
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading taxis...</p>
      </div>
    );
  }

  if (taxis.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No taxis found. Add one to get started.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>License Plate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxis.map((taxi) => (
              <TableRow key={taxi.id}>
                <TableCell className="font-medium">{taxi.licensePlate}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`active-switch-${taxi.id}`}
                      checked={taxi.isActive}
                      onCheckedChange={() => handleToggleActive(taxi)}
                      aria-label={taxi.isActive ? "Deactivate taxi" : "Activate taxi"}
                    />
                     <Badge variant={taxi.isActive ? "default" : "secondary"} className={taxi.isActive ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}>
                        {taxi.isActive ? "Active" : "Inactive"}
                     </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                   <Button variant="ghost" size="icon" onClick={() => handleEditTaxi(taxi)} aria-label="Edit taxi">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Delete taxi">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the taxi with license plate {taxi.licensePlate}.
                          This action cannot be undone. Consider deactivating it instead if it might be used later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTaxi(taxi.id)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete Taxi
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       {editingTaxi && (
        <AddTaxiModal
          isOpen={isEditModalOpen}
          setIsOpen={setIsEditModalOpen}
          taxiToEdit={editingTaxi}
          onClose={() => setEditingTaxi(null)}
        />
      )}
    </>
  );
}
