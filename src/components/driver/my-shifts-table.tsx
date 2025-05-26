
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
import { useTranslation } from "@/hooks/useTranslation"; // Added

export default function MyShiftsTable() {
  const { userProfile, loading: authLoading } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation(); // Added

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
      orderBy("startTime", "desc") 
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const shiftsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
      const relevantShifts = shiftsData.filter(shift => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return shift.endTime.toDate() > sevenDaysAgo;
      });
      setShifts(relevantShifts);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching shifts:", error);
      toast({ variant: "destructive", title: t('error'), description: "Could not load your shifts." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile, authLoading, toast, t]);

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await deleteDoc(doc(db, "shifts", shiftId));
      toast({ title: t('success'), description: t('shiftDeletedSuccessfully') });
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({ variant: "destructive", title: t('error'), description: t('errorDeletingShift') });
    }
  };
  
  const handleEditShift = (shift: Shift) => {
    toast({ 
        title: t('edit'), 
        description: t('editShiftToastMessage', { 
            taxiLicensePlate: shift.taxiLicensePlate, 
            date: format(shift.startTime.toDate(), "PPP") 
        })
    });
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">{t('loadingYourShifts')}</p>
      </div>
    );
  }

  if (shifts.length === 0) {
    return <p className="text-center text-muted-foreground py-10">{t('noShiftsFound')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('taxi')}</TableHead>
            <TableHead>{t('date')}</TableHead>
            <TableHead>{t('startTime')}</TableHead>
            <TableHead>{t('endTime')}</TableHead>
            <TableHead className="text-right">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => {
            const startTimeDate = shift.startTime.toDate();
            const endTimeDate = shift.endTime.toDate();
            const startDateStr = startTimeDate.toDateString();
            const endDateStr = endTimeDate.toDateString();
            
            let endTimeDisplay = format(endTimeDate, "p");
            if (startDateStr !== endDateStr) {
                endTimeDisplay = format(endTimeDate, "MMM d, p");
            }

            return (
              <TableRow key={shift.id}>
                <TableCell className="font-medium">{shift.taxiLicensePlate}</TableCell>
                <TableCell>{format(startTimeDate, "EEE, MMM d, yyyy")}</TableCell>
                <TableCell>{format(startTimeDate, "p")}</TableCell>
                <TableCell>{endTimeDisplay}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditShift(shift)} aria-label={t('edit')}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label={t('delete')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('deleteShiftConfirmationMessage', {
                            taxiLicensePlate: shift.taxiLicensePlate,
                            date: format(startTimeDate, "PPP"),
                            startTime: format(startTimeDate, "p"),
                            endTime: format(endTimeDate, "p")
                          })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteShift(shift.id)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          {t('delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
