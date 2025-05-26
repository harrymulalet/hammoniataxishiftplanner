
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where, runTransaction } from "firebase/firestore";
import { CalendarIcon, Car, Clock, Edit3, Loader2, User } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, addDays, parse } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import type { Shift, Taxi, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

const adminShiftSchema = z.object({
  driverId: z.string().min(1, "Please select a driver."),
  taxiId: z.string().min(1, "Please select a taxi."),
  date: z.date({ required_error: "Please select a date." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:MM)."),
}).refine(data => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  let startTotalMinutes = startH * 60 + startM;
  let endTotalMinutes = endH * 60 + endM;

  if (endTotalMinutes <= startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  return durationMinutes > 0;
}, {
  message: "End time must be after start time (or on the next day for overnight shifts).",
  path: ["endTime"],
}).refine(data => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  let startTotalMinutes = startH * 60 + startM;
  let endTotalMinutes = endH * 60 + endM;

  if (endTotalMinutes <= startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }
  const durationMillis = (endTotalMinutes - startTotalMinutes) * 60 * 1000;
  return durationMillis <= 10 * 60 * 60 * 1000; // Max 10 hours
}, {
  message: "Shift duration cannot exceed 10 hours.",
  path: ["endTime"],
});

type AdminShiftFormValues = z.infer<typeof adminShiftSchema>;

interface AdminShiftFormModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  shiftToEdit?: Shift | null;
  onShiftSaved?: () => void;
}

export default function AdminShiftFormModal({ isOpen, setIsOpen, shiftToEdit, onShiftSaved }: AdminShiftFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableTaxis, setAvailableTaxis] = useState<Taxi[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<UserProfile[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation();

  const isEditing = !!shiftToEdit;

  const form = useForm<AdminShiftFormValues>({
    resolver: zodResolver(adminShiftSchema),
    defaultValues: {
      driverId: "",
      taxiId: "",
      date: new Date(),
      startTime: "",
      endTime: "",
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const taxisQuery = query(collection(db, "taxis"), where("isActive", "==", true));
        const taxisSnapshot = await getDocs(taxisQuery);
        setAvailableTaxis(taxisSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Taxi)));

        const driversQuery = query(collection(db, "users"), where("role", "==", "driver"));
        const driversSnapshot = await getDocs(driversQuery);
        setAvailableDrivers(driversSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      } catch (error) {
        console.error("Error fetching initial data for shift modal:", error);
        toast({ variant: "destructive", title: t('error'), description: "Could not load driver or taxi data." });
      }
      setIsLoading(false);
    };

    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen, toast, t]);

  useEffect(() => {
    if (isOpen && shiftToEdit) {
      const startDate = shiftToEdit.startTime.toDate();
      form.reset({
        driverId: shiftToEdit.driverId,
        taxiId: shiftToEdit.taxiId,
        date: startDate,
        startTime: format(startDate, "HH:mm"),
        endTime: format(shiftToEdit.endTime.toDate(), "HH:mm"),
      });
    } else if (isOpen && !isEditing) {
      form.reset({
        driverId: "",
        taxiId: "",
        date: new Date(),
        startTime: "",
        endTime: "",
      });
    }
  }, [isOpen, shiftToEdit, form, isEditing]);

  const checkTaxiConflict = async (taxiId: string, shiftStart: Date, shiftEnd: Date, currentShiftId?: string): Promise<boolean> => {
    const shiftsRef = collection(db, "shifts");
    const q1 = query(
      shiftsRef,
      where("taxiId", "==", taxiId),
      where("endTime", ">", Timestamp.fromDate(shiftStart))
    );
    const q2 = query(
      shiftsRef,
      where("taxiId", "==", taxiId),
      where("startTime", "<", Timestamp.fromDate(shiftEnd))
    );
    
    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const conflictingShifts = new Map<string, any>();
    snapshot1.docs.forEach(doc => { if (doc.id !== currentShiftId) conflictingShifts.set(doc.id, doc.data())});
    snapshot2.docs.forEach(doc => { if (doc.id !== currentShiftId) conflictingShifts.set(doc.id, doc.data())});

    for (const existingShift of conflictingShifts.values()) {
        const existingStartTime = (existingShift.startTime as Timestamp).toDate();
        const existingEndTime = (existingShift.endTime as Timestamp).toDate();
        if (shiftStart < existingEndTime && shiftEnd > existingStartTime) {
            return true;
        }
    }
    return false;
  };
  
  const checkDriverConflict = async (driverId: string, shiftStart: Date, shiftEnd: Date, currentShiftId?: string): Promise<boolean> => {
    const shiftsRef = collection(db, "shifts");
    const q1 = query(
      shiftsRef,
      where("driverId", "==", driverId),
      where("endTime", ">", Timestamp.fromDate(shiftStart))
    );
    const q2 = query(
      shiftsRef,
      where("driverId", "==", driverId),
      where("startTime", "<", Timestamp.fromDate(shiftEnd))
    );

    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const conflictingShifts = new Map<string, any>();
    snapshot1.docs.forEach(doc => { if (doc.id !== currentShiftId) conflictingShifts.set(doc.id, doc.data())});
    snapshot2.docs.forEach(doc => { if (doc.id !== currentShiftId) conflictingShifts.set(doc.id, doc.data())});

    for (const existingShift of conflictingShifts.values()) {
        const existingStartTime = (existingShift.startTime as Timestamp).toDate();
        const existingEndTime = (existingShift.endTime as Timestamp).toDate();
        if (shiftStart < existingEndTime && shiftEnd > existingStartTime) {
            return true;
        }
    }
    return false;
  };


  async function onSubmit(data: AdminShiftFormValues) {
    setIsLoading(true);

    try {
      const [startH, startM] = data.startTime.split(':').map(Number);
      const [endH, endM] = data.endTime.split(':').map(Number);

      const shiftStartTime = new Date(data.date);
      shiftStartTime.setHours(startH, startM, 0, 0);

      let shiftEndTime = new Date(data.date);
      shiftEndTime.setHours(endH, endM, 0, 0);

      if (endH * 60 + endM <= startH * 60 + startM) {
        shiftEndTime = addDays(shiftEndTime, 1);
      }
      
      const taxiConflict = await checkTaxiConflict(data.taxiId, shiftStartTime, shiftEndTime, isEditing ? shiftToEdit?.id : undefined);
      if (taxiConflict) {
        toast({
          variant: "destructive",
          title: t('bookingConflictTitle'),
          description: t('bookingConflictDescription', { 
            date: format(data.date, "PPP"), 
            startTime: data.startTime, 
            endTime: data.endTime 
          }),
          duration: 7000,
        });
        setIsLoading(false);
        return;
      }

      const driverDetails = availableDrivers.find(d => d.uid === data.driverId);
      if (!driverDetails) {
          toast({ variant: "destructive", title: t('error'), description: "Selected driver details not found." });
          setIsLoading(false);
          return;
      }

      const driverConflict = await checkDriverConflict(data.driverId, shiftStartTime, shiftEndTime, isEditing ? shiftToEdit?.id : undefined);
      if (driverConflict) {
         toast({
          variant: "destructive",
          title: t('shiftConflictDriverTitle'),
          description: t('shiftConflictDriverDescription', { 
            driverName: `${driverDetails.firstName} ${driverDetails.lastName}`,
            date: format(data.date, "PPP"), 
            startTime: data.startTime, 
            endTime: data.endTime 
          }),
          duration: 7000,
        });
        setIsLoading(false);
        return;
      }

      const selectedTaxi = availableTaxis.find(t => t.id === data.taxiId);
      if (!selectedTaxi) {
          toast({ variant: "destructive", title: t('error'), description: "Selected taxi details not found." });
          setIsLoading(false);
          return;
      }

      const shiftData = {
        driverId: data.driverId,
        driverFirstName: driverDetails.firstName,
        driverLastName: driverDetails.lastName,
        taxiId: data.taxiId,
        taxiLicensePlate: selectedTaxi.licensePlate,
        startTime: Timestamp.fromDate(shiftStartTime),
        endTime: Timestamp.fromDate(shiftEndTime),
      };

      if (isEditing && shiftToEdit) {
        const shiftRef = doc(db, "shifts", shiftToEdit.id);
        await updateDoc(shiftRef, shiftData);
        toast({ title: t('success'), description: t('shiftUpdatedSuccessfully') });
      } else {
        await addDoc(collection(db, "shifts"), {
          ...shiftData,
          createdAt: serverTimestamp(),
        });
        toast({ title: t('success'), description: t('shiftAddedSuccessfully') });
      }
      
      form.reset();
      setIsOpen(false);
      if (onShiftSaved) onShiftSaved();

    } catch (error) {
      console.error("Error saving shift:", error);
      toast({ variant: "destructive", title: t('error'), description: t('errorSavingShift') });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('adminShiftModalTitleEdit') : t('adminShiftModalTitleAdd')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('adminShiftModalDescriptionEdit') : t('adminShiftModalDescriptionAdd')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('selectDriver')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={availableDrivers.length === 0}>
                        <SelectValue placeholder={availableDrivers.length > 0 ? t('selectDriverPlaceholder') : t('noDriversAvailable')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableDrivers.map(driver => (
                        <SelectItem key={driver.uid} value={driver.uid}>
                          {driver.firstName} {driver.lastName} ({driver.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxiId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('taxi')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={availableTaxis.length === 0}>
                        <SelectValue placeholder={availableTaxis.length > 0 ? t('selectATaxi') : t('noTaxisAvailable')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTaxis.map(taxi => (
                        <SelectItem key={taxi.id} value={taxi.id}>
                          {taxi.licensePlate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('selectDate')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>{t('pickDate')}</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('startTime')}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('endTime')}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={isLoading || availableDrivers.length === 0 || availableTaxis.length === 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Edit3 className="mr-2 h-4 w-4" /> : <Clock className="mr-2 h-4 w-4" />)}
                {isEditing ? t('saveChanges') : t('adminAddNewShift')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

