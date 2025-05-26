
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { doc, setDoc, serverTimestamp, updateDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, Car, Edit3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import type { Taxi } from "@/lib/types";

const taxiSchema = z.object({
  licensePlate: z.string().min(3, "License plate must be at least 3 characters.").max(15, "License plate too long.")
    .regex(/^[A-Z0-9\s-]+$/, "License plate can only contain uppercase letters, numbers, spaces, and hyphens."),
  isActive: z.boolean().default(true),
});

type TaxiFormValues = z.infer<typeof taxiSchema>;

interface AddTaxiModalProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  taxiToEdit?: Taxi | null;
  onClose?: () => void;
}

// Function to normalize license plate (e.g., remove spaces, uppercase) to use as ID
const normalizeLicensePlate = (plate: string) => plate.toUpperCase().replace(/\s+/g, '-');


export default function AddTaxiModal({ isOpen: controlledIsOpen, setIsOpen: setControlledIsOpen, taxiToEdit, onClose }: AddTaxiModalProps) {
  const [internalIsOpen, setIsInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const isEditing = !!taxiToEdit;
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledIsOpen !== undefined ? setControlledIsOpen : setIsInternalOpen;


  const form = useForm<TaxiFormValues>({
    resolver: zodResolver(taxiSchema),
    defaultValues: isEditing ? {
      licensePlate: taxiToEdit.licensePlate,
      isActive: taxiToEdit.isActive,
    } : {
      licensePlate: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (taxiToEdit) {
      form.reset({
        licensePlate: taxiToEdit.licensePlate,
        isActive: taxiToEdit.isActive,
      });
    } else {
      form.reset({
        licensePlate: "",
        isActive: true,
      });
    }
  }, [taxiToEdit, form, isOpen]);

  async function onSubmit(data: TaxiFormValues) {
    if (!userProfile) {
      toast({ variant: "destructive", title: "Error", description: "Admin user not found." });
      return;
    }
    setIsLoading(true);

    try {
      const normalizedPlate = normalizeLicensePlate(data.licensePlate);

      if (isEditing && taxiToEdit) {
        // If license plate changed, it means ID changes. This is complex.
        // Typically, ID (normalized plate) should be immutable or handled with care (delete old, create new).
        // For simplicity, if plate changes, we update. If ID was normalized plate, this is fine.
        // If ID was auto-generated, this needs different logic if normalizedPlate is the ID.
        // Assuming taxiToEdit.id IS the normalized old plate.
        const taxiRef = doc(db, "taxis", taxiToEdit.id); // Use existing ID for update
        await updateDoc(taxiRef, {
          licensePlate: data.licensePlate, // Store the display version
          isActive: data.isActive,
        });
        toast({ title: "Success", description: "Taxi updated successfully." });

      } else {
         // Check if taxi with this normalized license plate already exists
        const taxiRef = doc(db, "taxis", normalizedPlate);
        const taxiSnap = await getDocs(query(collection(db, "taxis"), where("licensePlate", "==", data.licensePlate)));
        if (!taxiSnap.empty && taxiSnap.docs.some(d => d.id === normalizedPlate)) {
          toast({ variant: "destructive", title: "Error", description: "A taxi with this license plate already exists." });
          setIsLoading(false);
          return;
        }

        await setDoc(doc(db, "taxis", normalizedPlate), {
          licensePlate: data.licensePlate,
          isActive: data.isActive,
          createdAt: serverTimestamp() as Timestamp,
          createdBy: userProfile.uid,
        });
        toast({ title: "Success", description: "Taxi added successfully." });
      }
      form.reset({ licensePlate: "", isActive: true });
      setIsOpen(false);
      if (onClose) onClose();
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} taxi:`, error);
      toast({ variant: "destructive", title: "Error", description: error.message || `Could not ${isEditing ? 'update' : 'add'} taxi.` });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!taxiToEdit && (
        <DialogTrigger asChild>
          <Button>
            <Car className="mr-2 h-4 w-4" /> Add New Taxi
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Taxi" : "Add New Taxi"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the taxi details." : "Enter the license plate for the new taxi."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="licensePlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Plate</FormLabel>
                  <FormControl><Input placeholder="HH-AB 123" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Is this taxi currently active and available for bookings?
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); if (onClose) onClose(); }}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Edit3 className="mr-2 h-4 w-4" /> : <Car className="mr-2 h-4 w-4" />)}
                {isEditing ? "Save Changes" : "Add Taxi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
