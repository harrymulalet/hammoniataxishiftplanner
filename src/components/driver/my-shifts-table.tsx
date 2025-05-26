
"use client";

import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Edit3, Trash2, CalendarIcon, Clock } from "lucide-react";

import { db } from "@/lib/firebase";
import type { Shift } from "@/lib/types";
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
// Note: A proper edit modal would be needed for editing shifts.
// For simplicity, this example focuses on view and delete. Edit could open a similar modal to TaxiBookingModal.

export default function MyShiftsTable() {
  const { userProfile, loading: authLoading } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !userProfile) {
      setIsLoading(authLoading);
      return;
    }

    setIsLoading(true);
    const shiftsRef = collection(db, "shifts");
    const q = query(
      shiftsRef,
      where("driverId", "==", userProfile.uid),
      orderBy("startTime", "desc") // Show most recent/upcoming first
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const shiftsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
      // Filter for shifts that haven't ended yet, or ended recently (e.g., last 7 days)
      const relevantShifts = shiftsData.filter(shift => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return shift.endTime.toDate() > sevenDaysAgo;
      });
      setShifts(relevantShifts);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching shifts:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load your shifts." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile, authLoading, toast]);

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await deleteDoc(doc(db, "shifts", shiftId));
      toast({ title: "Success", description: "Shift deleted successfully." });
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete shift." });
    }
  };
  
  const handleEditShift = (shift: Shift) => {
    // This would typically open a modal pre-filled with shift data
    // Similar to TaxiBookingModal but for editing.
    toast({ title: "Edit Shift", description: `Editing shift for ${shift.taxiLicensePlate} on ${format(shift.startTime.toDate(), "PPP")}. (Edit functionality not fully implemented in this example)`});
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading your shifts...</p>
      </div>
    );
  }

  if (shifts.length === 0) {
    return <p className="text-center text-muted-foreground py-10">You have no upcoming or recent shifts.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Taxi</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => (
            <TableRow key={shift.id}>
              <TableCell className="font-medium">{shift.taxiLicensePlate}</TableCell>
              <TableCell>{format(shift.startTime.toDate(), "EEE, MMM d, yyyy")}</TableCell>
              <TableCell>{format(shift.startTime.toDate(), "p")}</TableCell>
              <TableCell>{format(shift.endTime.toDate(), "p")}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleEditShift(shift)} aria-label="Edit shift">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Delete shift">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the shift for
                        taxi {shift.taxiLicensePlate} on {format(shift.startTime.toDate(), "PPP")}
                        from {format(shift.startTime.toDate(), "p")} to {format(shift.endTime.toDate(), "p")}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteShift(shift.id)}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Delete
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
  );
}
