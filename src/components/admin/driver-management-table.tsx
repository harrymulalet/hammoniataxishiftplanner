
"use client";

import { collection, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Loader2, Edit3, Trash2, UserPlus } from "lucide-react";

import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
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
import AddDriverModal from "./driver-form-modal"; // Re-use for editing

export default function DriverManagementTable() {
  const { userProfile: adminProfile, loading: authLoading } = useAuth();
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDriver, setEditingDriver] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!adminProfile || adminProfile.role !== 'admin') {
        setIsLoading(false);
        // Optional: Show message or redirect if not admin, though layout should handle this.
        return;
    }

    setIsLoading(true);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "driver"), orderBy("lastName", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const driversData = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setDrivers(driversData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching drivers:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load driver data." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [adminProfile, authLoading, toast]);

  const handleDeleteDriver = async (driverId: string) => {
    // IMPORTANT: Deleting a Firebase Auth user requires Admin SDK (backend) or re-authentication.
    // This function will only delete the Firestore user profile.
    // For a full solution, a Cloud Function would be needed to delete the Auth user.
    // Here, we'll show a warning.
    toast({
      variant: "default",
      title: "Partial Deletion",
      description: "Driver profile in database deleted. Firebase Auth user must be deleted manually from Firebase Console for full removal.",
      duration: 7000,
    });
    try {
      await deleteDoc(doc(db, "users", driverId));
      // Consider also deleting associated shifts or reassigning them.
      toast({ title: "Success", description: "Driver profile deleted." });
    } catch (error) {
      console.error("Error deleting driver profile:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete driver profile." });
    }
  };

  const handleEditDriver = (driver: UserProfile) => {
    setEditingDriver(driver);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading drivers...</p>
      </div>
    );
  }

  if (drivers.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No drivers found.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Employee Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.uid}>
                <TableCell className="font-medium">{driver.firstName} {driver.lastName}</TableCell>
                <TableCell>{driver.email}</TableCell>
                <TableCell>{driver.employeeType || 'N/A'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditDriver(driver)} aria-label="Edit driver">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Delete driver">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will delete the driver profile for {driver.firstName} {driver.lastName}.
                          The Firebase Authentication user account will need to be deleted manually from the Firebase Console.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteDriver(driver.uid)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete Profile
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
      {editingDriver && (
        <AddDriverModal
          isOpen={isEditModalOpen}
          setIsOpen={setIsEditModalOpen}
          driverToEdit={editingDriver}
          onClose={() => setEditingDriver(null)}
        />
      )}
    </>
  );
}
