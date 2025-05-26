
"use client";

import { collection, query, onSnapshot, orderBy, Timestamp, doc, deleteDoc } from "firebase/firestore";
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


export default function AllShiftsView() {
  const { userProfile: adminProfile, loading: authLoading } = useAuth();
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
    // Fetch drivers
    const driversUnsub = onSnapshot(query(collection(db, "users"), where("role", "==", "driver")), snapshot => {
      setDrivers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    });
    // Fetch taxis
    const taxisUnsub = onSnapshot(query(collection(db, "taxis")), snapshot => {
      setTaxis(snapshot.docs.map(t => ({ id: t.id, ...t.data() } as Taxi)));
    });
    // Fetch shifts
    const shiftsRef = collection(db, "shifts");
    const q = query(shiftsRef, orderBy("startTime", "desc"));

    const shiftsUnsub = onSnapshot(q, (querySnapshot) => {
      const shiftsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
      setAllShifts(shiftsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching shifts:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load shifts data." });
      setIsLoading(false);
    });

    return () => {
      driversUnsub();
      taxisUnsub();
      shiftsUnsub();
    };
  }, [adminProfile, authLoading, toast]);

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
      toast({ title: "Success", description: "Shift deleted successfully." });
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete shift." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading all shifts...</p>
      </div>
    );
  }
  
  // TODO: Add assign shift functionality (modal similar to driver booking but admin can pick driver)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-card">
        <div>
          <label htmlFor="driverFilter" className="text-sm font-medium text-muted-foreground block mb-1">Filter by Driver</label>
          <Select value={filterDriverId} onValueChange={setFilterDriverId}>
            <SelectTrigger id="driverFilter">
              <SelectValue placeholder="All Drivers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Drivers</SelectItem>
              {drivers.map(d => <SelectItem key={d.uid} value={d.uid}>{d.firstName} {d.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="taxiFilter" className="text-sm font-medium text-muted-foreground block mb-1">Filter by Taxi</label>
          <Select value={filterTaxiId} onValueChange={setFilterTaxiId}>
            <SelectTrigger id="taxiFilter">
              <SelectValue placeholder="All Taxis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Taxis</SelectItem>
              {taxis.map(t => <SelectItem key={t.id} value={t.id}>{t.licensePlate}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
           <label htmlFor="dateFilter" className="text-sm font-medium text-muted-foreground block mb-1">Filter by Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="dateFilter"
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${!filterDate && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterDate ? format(filterDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={(date) => {setFilterDate(date);}}
                initialFocus
              />
               <Button variant="ghost" className="w-full mt-1" onClick={() => setFilterDate(undefined)}>Clear Date</Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {filteredShifts.length === 0 && (
        <p className="text-center text-muted-foreground py-10">No shifts match your filters, or no shifts found.</p>
      )}

      {filteredShifts.length > 0 && (
        <div className="overflow-x-auto">
        <Table>
          <TableCaption>A list of all booked shifts.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Taxi</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShifts.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell className="font-medium">{shift.driverFirstName} {shift.driverLastName}</TableCell>
                <TableCell>{shift.taxiLicensePlate}</TableCell>
                <TableCell>{format(shift.startTime.toDate(), "EEE, MMM d, yyyy")}</TableCell>
                <TableCell>{format(shift.startTime.toDate(), "p")}</TableCell>
                <TableCell>{format(shift.endTime.toDate(), "p")}</TableCell>
                <TableCell className="text-right">
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
                          This will permanently delete the shift for {shift.driverFirstName} {shift.driverLastName} on taxi {shift.taxiLicensePlate} 
                          ({format(shift.startTime.toDate(), "PPP 'at' p")}). This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteShift(shift.id)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete Shift
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
      )}
    </div>
  );
}
