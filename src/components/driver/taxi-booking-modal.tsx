
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, getDocs, query, serverTimestamp, Timestamp, where } from "firebase/firestore";
import { CalendarIcon, Car, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import type { ShiftFormData, Taxi } from "@/lib/types";
import { cn } from "@/lib/utils";

const bookingSchema = z.object({
  taxiId: z.string().min(1, "Please select a taxi."),
  dates: z.array(z.date()).min(1, "Please select at least one date."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:MM)."),
}).refine(data => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const startTotalMinutes = startH * 60 + startM;
  const endTotalMinutes = endH * 60 + endM;
  return endTotalMinutes > startTotalMinutes;
}, {
  message: "End time must be after start time.",
  path: ["endTime"],
}).refine(data => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const durationMillis = ((endH * 60 + endM) - (startH * 60 + startM)) * 60 * 1000;
  return durationMillis <= 10 * 60 * 60 * 1000;
}, {
  message: "Shift duration cannot exceed 10 hours.",
  path: ["endTime"],
});

export default function TaxiBookingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTaxis, setAvailableTaxis] = useState<Taxi[]>([]);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const form = useForm<ShiftFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      taxiId: "",
      dates: [],
      startTime: "",
      endTime: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchTaxis = async () => {
        try {
          const q = query(collection(db, "taxis"), where("isActive", "==", true));
          const querySnapshot = await getDocs(q);
          const taxisData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Taxi));
          setAvailableTaxis(taxisData);
        } catch (error) {
          console.error("Error fetching taxis:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load available taxis." });
        }
      };
      fetchTaxis();
    }
  }, [isOpen, toast]);

  const checkConflict = async (taxiId: string, shiftStart: Date, shiftEnd: Date): Promise<boolean> => {
    const shiftsRef = collection(db, "shifts");
    const q = query(
      shiftsRef,
      where("taxiId", "==", taxiId),
      where("startTime", "<", Timestamp.fromDate(shiftEnd)),
      where("endTime", ">", Timestamp.fromDate(shiftStart))
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  async function onSubmit(data: ShiftFormData) {
    if (!userProfile) {
      toast({ variant: "destructive", title: "Error", description: "User not found." });
      return;
    }
    setIsLoading(true);

    try {
      for (const date of data.dates) {
        const [startH, startM] = data.startTime.split(':').map(Number);
        const [endH, endM] = data.endTime.split(':').map(Number);

        const shiftStartTime = new Date(date);
        shiftStartTime.setHours(startH, startM, 0, 0);

        const shiftEndTime = new Date(date);
        shiftEndTime.setHours(endH, endM, 0, 0);

        const conflict = await checkConflict(data.taxiId, shiftStartTime, shiftEndTime);
        if (conflict) {
          toast({
            variant: "destructive",
            title: "Booking Conflict",
            description: `Taxi is already booked for ${format(date, "PPP")} between ${data.startTime} and ${data.endTime}.`,
          });
          setIsLoading(false);
          return; 
        }

        const selectedTaxi = availableTaxis.find(t => t.id === data.taxiId);

        await addDoc(collection(db, "shifts"), {
          taxiId: data.taxiId,
          taxiLicensePlate: selectedTaxi?.licensePlate || 'N/A',
          driverId: userProfile.uid,
          driverFirstName: userProfile.firstName,
          driverLastName: userProfile.lastName,
          startTime: Timestamp.fromDate(shiftStartTime),
          endTime: Timestamp.fromDate(shiftEndTime),
          createdAt: serverTimestamp(),
        });
      }
      toast({ title: "Success", description: `Shift${data.dates.length > 1 ? 's' : ''} booked successfully.` });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Error booking shift:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not book shift(s)." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Car className="mr-2 h-4 w-4" /> Book New Shift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book a Taxi Shift</DialogTitle>
          <DialogDescription>
            Select a taxi, date(s), and time for your shift. Max 10 hours per shift.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="taxiId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a taxi" />
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
              name="dates"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date(s)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value?.length && "text-muted-foreground"
                          )}
                        >
                          {field.value?.length > 0
                            ? field.value.map(date => format(date, "PPP")).join(', ')
                            : "Pick date(s)"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="multiple"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
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
                    <FormLabel>Start Time</FormLabel>
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
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                Book Shift(s)
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
