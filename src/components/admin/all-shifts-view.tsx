
"use client";

import { collection, query, onSnapshot, orderBy, Timestamp, doc, deleteDoc, where } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Loader2, Trash2, User, Car, Calendar as CalendarIcon } from "lucide-react";

import { db } from "@/lib/firebase";
import type { Shift, UserProfile, Taxi } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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


export default function AllShiftsView() {
  const { userProfile: adminProfile, loading: authLoading } = useAuth();
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [taxis, setTaxis] = useState<Taxi[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation(); // Added

  const [filterDriverId, setFilterDriverId] = useState<string>("");
  const [filterTaxiId, setFilterTaxiId] = useState<string>("");
  const [filterDate, setFilterDate] = useState<Date | undefined>();

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
    const driversUnsub = onSnapshot(query(collection(db, "users"), where("role", "==", "driver")), snapshot => {
      setDrivers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    });
    const taxisUnsub = onSnapshot(query(collection(db, "taxis")), snapshot => {
      setTaxis(snapshot.docs.map(t => ({ id: t.id, ...t.data() } as Taxi)));
    });
    const shiftsRef = collection(db, "shifts");
    const q = query(shiftsRef, orderBy("startTime", "desc"));

    const shiftsUnsub = onSnapshot(q, (querySnapshot) => {
      const shiftsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
      setAllShifts(shiftsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching shifts:", error);
      toast({ variant: "destructive", title: t('error'), description: "Could not load shifts data." });
      setIsLoading(false);
    });

    return () => {
      driversUnsub();
      taxisUnsub();
      shiftsUnsub();
    };
  }, [adminProfile, authLoading, toast, t]);

  const filteredShifts = useMemo(() => {
    return allShifts.filter(shift => {
      const shiftDate = shift.startTime.toDate();
      const matchesDriver = filterDriverId ? shift.driverId === filterDriverId : true;
      const matchesTaxi = filterTaxiId ? shift.taxiId === filterTaxiId : true;
      const matchesDate = filterDate ?
        shiftDate.getFullYear() === filterDate.getFullYear() &&
        shiftDate.getMonth() === filterDate.getMonth() &&
        shiftDate.getDate() === filterDate.getDate()
        : true;
      return matchesDriver && matchesTaxi && matchesDate;
    });
  }, [allShifts, filterDriverId, filterTaxiId, filterDate]);

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await deleteDoc(doc(db, "shifts", shiftId));
      toast({ title: t('success'), description: t('shiftDeletedSuccessfully') });
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({ variant: "destructive", title: t('error'), description: t('errorDeletingShift') });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">{t('loadingAllShifts')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-card">
        <div>
          <label htmlFor="driverFilter" className="text-sm font-medium text-muted-foreground block mb-1">{t('filterByDriver')}</label>
          <Select value={filterDriverId} onValueChange={(value) => setFilterDriverId(value === "all" ? "" : value)}>
            <SelectTrigger id="driverFilter">
              <SelectValue placeholder={t('allDriversPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allDriversPlaceholder')}</SelectItem>
              {drivers.map(d => <SelectItem key={d.uid} value={d.uid}>{d.firstName} {d.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="taxiFilter" className="text-sm font-medium text-muted-foreground block mb-1">{t('filterByTaxi')}</label>
          <Select value={filterTaxiId} onValueChange={(value) => setFilterTaxiId(value === "all" ? "" : value)}>
            <SelectTrigger id="taxiFilter">
              <SelectValue placeholder={t('allTaxisPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTaxisPlaceholder')}</SelectItem>
              {taxis.map(t => <SelectItem key={t.id} value={t.id}>{t.licensePlate}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
           <label htmlFor="dateFilter" className="text-sm font-medium text-muted-foreground block mb-1">{t('filterByDate')}</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="dateFilter"
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${!filterDate && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterDate ? format(filterDate, "PPP") : <span>{t('pickDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={(date) => {setFilterDate(date);}}
                initialFocus
              />
               <Button variant="ghost" className="w-full mt-1" onClick={() => setFilterDate(undefined)}>{t('clearDate')}</Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {filteredShifts.length === 0 && (
        <p className="text-center text-muted-foreground py-10">{t('noShiftsMatchFilters')}</p>
      )}

      {filteredShifts.length > 0 && (
        <div className="overflow-x-auto">
        <Table>
          <TableCaption>{t('bookedShiftsDescription')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{t('driverName')}</TableHead>
              <TableHead>{t('taxi')}</TableHead>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('startTime')}</TableHead>
              <TableHead>{t('endTime')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShifts.map((shift) => {
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
                  <TableCell className="font-medium">{shift.driverFirstName} {shift.driverLastName}</TableCell>
                  <TableCell>{shift.taxiLicensePlate}</TableCell>
                  <TableCell>{format(startTimeDate, "EEE, MMM d, yyyy")}</TableCell>
                  <TableCell>{format(startTimeDate, "p")}</TableCell>
                  <TableCell>{endTimeDisplay}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label={t('deleteShiftButton')}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('deleteShiftAdminConfirmation', { 
                              driverName: `${shift.driverFirstName} ${shift.driverLastName}`,
                              taxiLicensePlate: shift.taxiLicensePlate,
                              startTime: format(startTimeDate, "PPP 'at' p"),
                              endTime: format(endTimeDate, "PPP 'at' p")
                             })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteShift(shift.id)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            {t('deleteShiftButton')}
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
      )}
    </div>
  );
}
