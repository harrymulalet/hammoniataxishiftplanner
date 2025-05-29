
"use client";

import { collection, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc, where } from "firebase/firestore";
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
import AddDriverModal from "./driver-form-modal";
import { useTranslation } from "@/hooks/useTranslation"; // Added

export default function DriverManagementTable() {
  const { userProfile: adminProfile, loading: authLoading } = useAuth();
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDriver, setEditingDriver] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation(); // Added

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!adminProfile || adminProfile.role !== 'admin') {
        setIsLoading(false);
        setDrivers([]); // Clear drivers if not admin
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
      toast({ variant: "destructive", title: t('error'), description: t('errorLoadingDriverData') });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [adminProfile, authLoading, toast, t]);

  const handleDeleteDriver = async (driverId: string) => {
    toast({
      variant: "default",
      title: t('partialDeletion'),
      description: t('partialDeletionDesc'),
      duration: 7000,
    });
    try {
      await deleteDoc(doc(db, "users", driverId));
      toast({ title: t('success'), description: t('deleteProfile') });
    } catch (error) {
      console.error("Error deleting driver profile:", error);
      toast({ variant: "destructive", title: t('error'), description: "Could not delete driver profile." });
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
        <p className="ml-2">{t('loadingDrivers')}</p>
      </div>
    );
  }

  if (drivers.length === 0) {
    return <p className="text-center text-muted-foreground py-10">{t('noDriversFound')}</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('driverName')}</TableHead>
              <TableHead>{t('emailAddressLabel')}</TableHead>
              <TableHead>{t('employeeType')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.uid}>
                <TableCell className="font-medium">{driver.firstName} {driver.lastName}</TableCell>
                <TableCell>{driver.email}</TableCell>
                <TableCell>{driver.employeeType ? t(driver.employeeType as 'employeeTypeFullTime' | 'employeeTypePartTime' | 'employeeTypeOther') : 'N/A'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditDriver(driver)} aria-label={t('editDriver')}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label={t('deleteDriver')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('deleteDriverProfileConfirmationMessage', { firstName: driver.firstName, lastName: driver.lastName })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteDriver(driver.uid)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          {t('deleteProfile')}
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
