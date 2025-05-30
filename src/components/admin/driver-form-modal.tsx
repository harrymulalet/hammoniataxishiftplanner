
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth"; 
import { doc, setDoc, serverTimestamp, updateDoc, Timestamp, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { Loader2, UserPlus, Edit3, Eye, EyeOff } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { employeeTypes, type EmployeeType, type UserProfile, type Shift } from "@/lib/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth"; 

const driverSchemaBase = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  employeeType: z.enum(employeeTypes, { required_error: "Employee type is required." }),
});

const addDriverSchema = driverSchemaBase.extend({
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const editDriverSchema = driverSchemaBase; 

type AddDriverFormValues = z.infer<typeof addDriverSchema>;
type EditDriverFormValues = z.infer<typeof editDriverSchema>;

interface AddDriverModalProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  driverToEdit?: UserProfile | null;
  onClose?: () => void; 
}

export default function AddDriverModal({ isOpen: controlledIsOpen, setIsOpen: setControlledIsOpen, driverToEdit, onClose }: AddDriverModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { userProfile: currentActingUserProfile } = useAuth(); 

  const isEditing = !!driverToEdit;
  const currentSchema = isEditing ? editDriverSchema : addDriverSchema;

  const form = useForm<AddDriverFormValues | EditDriverFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: isEditing ? {
      firstName: driverToEdit.firstName,
      lastName: driverToEdit.lastName,
      email: driverToEdit.email,
      employeeType: driverToEdit.employeeType,
    } : {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      employeeType: undefined,
    },
  });
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledIsOpen !== undefined ? setControlledIsOpen : setInternalIsOpen;


  useEffect(() => {
    if (driverToEdit && isOpen) { 
      form.reset({
        firstName: driverToEdit.firstName,
        lastName: driverToEdit.lastName,
        email: driverToEdit.email, 
        employeeType: driverToEdit.employeeType,
      });
    } else if (!isEditing && isOpen) { 
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        employeeType: undefined,
      });
    }
  }, [driverToEdit, form, isOpen, isEditing]); 


  async function onSubmit(data: AddDriverFormValues | EditDriverFormValues) {
    setIsLoading(true);
    console.log('[DriverFormModal] Admin attempting action. Client-side admin profile:', currentActingUserProfile);

    try {
      if (isEditing && driverToEdit) {
        if (!currentActingUserProfile || currentActingUserProfile.role !== 'admin') {
           toast({
            variant: "destructive",
            title: t('error'),
            description: t('adminActionNotAuthorized'), 
          });
          setIsLoading(false);
          return;
        }

        const driverRef = doc(db, "users", driverToEdit.uid);
        const updatedProfileData: Partial<UserProfile> = {
          firstName: data.firstName,
          lastName: data.lastName,
          employeeType: data.employeeType,
        };
        await updateDoc(driverRef, updatedProfileData);
        toast({ title: t('success'), description: t('driverProfileUpdatedSuccessfully') });

        const nameChanged = data.firstName !== driverToEdit.firstName || data.lastName !== driverToEdit.lastName;
        if (nameChanged) {
          toast({ title: t('updatingShifts'), description: t('updatingShiftsDesc') });
          const shiftsQuery = query(collection(db, "shifts"), where("driverId", "==", driverToEdit.uid));
          const shiftsSnapshot = await getDocs(shiftsQuery);
          
          if (!shiftsSnapshot.empty) {
            const batch = writeBatch(db);
            shiftsSnapshot.forEach(shiftDoc => {
              batch.update(shiftDoc.ref, { 
                driverFirstName: data.firstName, 
                driverLastName: data.lastName 
              });
            });
            await batch.commit();
            toast({ title: t('shiftsUpdated'), description: t('shiftsUpdatedDesc') });
          }
        }

      } else { 
        if (!currentActingUserProfile || currentActingUserProfile.role !== 'admin') {
          toast({
            variant: "destructive",
            title: t('error'),
            description: t('adminActionNotAuthorizedDriverCreate'),
          });
          setIsLoading(false);
          return;
        }
        
        const addData = data as AddDriverFormValues;
        
        const userCredential = await createUserWithEmailAndPassword(auth, addData.email, addData.password!);
        const newDriver = userCredential.user;

        await setDoc(doc(db, "users", newDriver.uid), {
          uid: newDriver.uid,
          email: newDriver.email,
          firstName: addData.firstName,
          lastName: addData.lastName,
          role: "driver", 
          employeeType: addData.employeeType,
          createdAt: serverTimestamp() as Timestamp, 
        });
        toast({
          title: t('driverCreatedSuccessfully'),
          description: t('driverCreatedDesc', { firstName: addData.firstName, lastName: addData.lastName, password: addData.password! }),
          duration: 10000,
        });
      }
      form.reset(); 
      setIsOpen(false);
      if (onClose) onClose();
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} driver:`, error);
      
      let errorMessage = error.message || (isEditing ? t('errorUpdatingDriver') : t('errorAddingDriver'));
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('emailAlreadyInUseError');
      } else if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
        errorMessage = t('firestorePermissionErrorDriverCreate'); 
      }
      toast({ variant: "destructive", title: t('error'), description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) { 
      form.clearErrors(); 
      if (onClose) {
        onClose();
      }
      if (isEditing && driverToEdit) {
        form.reset({
            firstName: driverToEdit.firstName,
            lastName: driverToEdit.lastName,
            email: driverToEdit.email, 
            employeeType: driverToEdit.employeeType,
        });
      } else if (!isEditing) {
         form.reset({
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            employeeType: undefined,
        });
      }
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!driverToEdit && ( 
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" /> {t('addNewDriver')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editDriverModalTitle') : t('addDriverModalTitle')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('editDriverModalDescription') : t('addDriverModalDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('firstNameLabel')}</FormLabel>
                    <FormControl><Input placeholder={t('firstNamePlaceholder')} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('lastNameLabel')}</FormLabel>
                    <FormControl><Input placeholder={t('lastNamePlaceholder')} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('emailAddressLabel')}</FormLabel>
                  <FormControl><Input type="email" placeholder={t('emailPlaceholder')} {...field} disabled={isEditing} /></FormControl>
                  {isEditing && <p className="text-xs text-muted-foreground">{t('emailCannotBeChanged')}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('passwordLabel')}</FormLabel>
                     <FormControl>
                        <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('passwordPlaceholder')}
                            {...field}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                        >
                            {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                            <span className="sr-only">{showPassword ? t('hidePassword') : t('showPassword')}</span>
                        </Button>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="employeeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('employeeTypeLabel')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectEmployeeTypePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employeeTypes.map(type => (
                        <SelectItem key={type} value={type}>{t(type as 'employeeTypeFullTime' | 'employeeTypePartTime' | 'employeeTypeOther')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); if (onClose) onClose(); }}>{t('cancel')}</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Edit3 className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />)}
                {isEditing ? t('saveChanges') : t('addNewDriver')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
    

    