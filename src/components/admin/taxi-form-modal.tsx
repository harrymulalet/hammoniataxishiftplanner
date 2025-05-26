
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  doc, setDoc, serverTimestamp, updateDoc, Timestamp,
  collection, query, where, getDocs, writeBatch, runTransaction, getDoc, deleteDoc
} from "firebase/firestore";
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
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/translations";

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

const normalizeLicensePlate = (plate: string) => plate.toUpperCase().replace(/\s+/g, '-');


export default function AddTaxiModal({ isOpen: controlledIsOpen, setIsOpen: setControlledIsOpen, taxiToEdit, onClose }: AddTaxiModalProps) {
  const [internalIsOpen, setIsInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

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
      toast({ variant: "destructive", title: t('error'), description: t('adminUserNotFound') });
      return;
    }
    setIsLoading(true);

    try {
      const newLicensePlateDisplay = data.licensePlate;
      const newNormalizedPlateId = normalizeLicensePlate(newLicensePlateDisplay);

      if (isEditing && taxiToEdit) {
        const oldTaxiDocId = taxiToEdit.id;
        const oldLicensePlateDisplay = taxiToEdit.licensePlate;

        if (oldTaxiDocId === newNormalizedPlateId) {
          // Document ID (normalized plate) hasn't changed.
          // Simple field update for licensePlate display (e.g. casing) or isActive.
          const taxiRef = doc(db, "taxis", oldTaxiDocId);
          await updateDoc(taxiRef, {
            licensePlate: newLicensePlateDisplay, // Update display version
            isActive: data.isActive,
          });
          toast({ title: t('success'), description: t('taxiUpdatedSuccessfully') });

          // If display license plate changed (even if ID didn't), update denormalized field in shifts
          if (oldLicensePlateDisplay !== newLicensePlateDisplay) {
            toast({ title: t('updatingShifts'), description: t('updatingShiftsWithNewPlate') });
            const shiftsQuery = query(collection(db, "shifts"), where("taxiId", "==", oldTaxiDocId));
            const shiftsSnapshot = await getDocs(shiftsQuery);
            
            if (!shiftsSnapshot.empty) {
              const batch = writeBatch(db);
              shiftsSnapshot.forEach(shiftDoc => {
                batch.update(shiftDoc.ref, { 
                  taxiLicensePlate: newLicensePlateDisplay
                });
              });
              await batch.commit();
              toast({ title: t('shiftsUpdated'), description: t('shiftsUpdatedWithNewPlate') });
            }
          }
        } else {
          // Document ID (normalized plate) HAS changed. This is the complex "rename" operation.
          const newTaxiRef = doc(db, "taxis", newNormalizedPlateId);
          const newTaxiSnap = await getDoc(newTaxiRef); // Check for collision before transaction
          if (newTaxiSnap.exists()) {
            toast({ variant: "destructive", title: t('error'), description: t('taxiWithNewPlateExistsError', { licensePlate: newLicensePlateDisplay }) });
            setIsLoading(false);
            return;
          }

          // Query shifts associated with the old taxi ID before starting the transaction
          const shiftsQuery = query(collection(db, "shifts"), where("taxiId", "==", oldTaxiDocId));
          const shiftsSnapshot = await getDocs(shiftsQuery);

          await runTransaction(db, async (transaction) => {
            // 1. Get the old taxi document's data
            const oldTaxiDocRef = doc(db, "taxis", oldTaxiDocId);
            const oldTaxiDocSnap = await transaction.get(oldTaxiDocRef);
            if (!oldTaxiDocSnap.exists()) {
              throw new Error(t('taxiToEditNotFound'));
            }
            const oldTaxiData = oldTaxiDocSnap.data();

            // 2. Create the new taxi document with updated info and new ID
            const newTaxiData = {
              ...oldTaxiData,
              id: newNormalizedPlateId, // Crucial: store the new ID in the document itself
              licensePlate: newLicensePlateDisplay,
              isActive: data.isActive,
              // createdAt and createdBy are preserved from oldTaxiData
            };
            transaction.set(newTaxiRef, newTaxiData);

            // 3. Update all found shifts to point to the new taxiId and new licensePlate
            shiftsSnapshot.forEach(shiftDoc => {
              const shiftRef = doc(db, "shifts", shiftDoc.id);
              transaction.update(shiftRef, {
                taxiId: newNormalizedPlateId,
                taxiLicensePlate: newLicensePlateDisplay
              });
            });

            // 4. Delete the old taxi document
            transaction.delete(oldTaxiDocRef);
          });

          toast({ title: t('success'), description: t('taxiIdUpdatedSuccessfully', { oldPlate: oldLicensePlateDisplay, newPlate: newLicensePlateDisplay }) });
        }
      } else {
        // Creating a new taxi
        const taxiDocRef = doc(db, "taxis", newNormalizedPlateId);
        const existingTaxiSnap = await getDoc(taxiDocRef); // Check for collision

        if (existingTaxiSnap.exists()) {
            toast({ variant: "destructive", title: t('error'), description: t('taxiExistsError') });
            setIsLoading(false);
            return;
        }
        
        await setDoc(taxiDocRef, {
          id: newNormalizedPlateId, // Store normalized plate also as an 'id' field
          licensePlate: data.licensePlate,
          isActive: data.isActive,
          createdAt: serverTimestamp() as Timestamp,
          createdBy: userProfile.uid,
        });
        toast({ title: t('success'), description: t('taxiAddedSuccessfully') });
      }
      form.reset({ licensePlate: "", isActive: true });
      setIsOpen(false);
      if (onClose) onClose();
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} taxi:`, error);
      const errorMessageKey = isEditing ? 'errorUpdatingTaxi' : 'errorAddingTaxi';
      toast({ variant: "destructive", title: t('error'), description: error.message || t(errorMessageKey as TranslationKey) });
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
            <Car className="mr-2 h-4 w-4" /> {t('addNewTaxi')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editTaxiModalTitle') : t('addTaxiModalTitle')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('editTaxiModalDescription') : t('addTaxiModalDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="licensePlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('licensePlateLabel')}</FormLabel>
                  <FormControl><Input placeholder={t('licensePlatePlaceholder')} {...field} /></FormControl>
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
                    <FormLabel>{t('activeLabel')}</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      {t('activeDescription')}
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
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); if (onClose) onClose(); }}>{t('cancel')}</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Edit3 className="mr-2 h-4 w-4" /> : <Car className="mr-2 h-4 w-4" />)}
                {isEditing ? t('saveChanges') : t('addNewTaxi')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
