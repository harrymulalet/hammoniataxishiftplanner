
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"; // updateProfile not needed for email/pass users directly for these fields
import { doc, setDoc, serverTimestamp, updateDoc, Timestamp } from "firebase/firestore";
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
import { employeeTypes, type EmployeeType, type UserProfile } from "@/lib/types";

const driverSchemaBase = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  employeeType: z.enum(employeeTypes, { required_error: "Employee type is required." }),
});

const addDriverSchema = driverSchemaBase.extend({
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const editDriverSchema = driverSchemaBase; // Password not edited here directly

type AddDriverFormValues = z.infer<typeof addDriverSchema>;
type EditDriverFormValues = z.infer<typeof editDriverSchema>;

interface AddDriverModalProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  driverToEdit?: UserProfile | null;
  onClose?: () => void; // To reset driverToEdit state
}

export default function AddDriverModal({ isOpen: controlledIsOpen, setIsOpen: setControlledIsOpen, driverToEdit, onClose }: AddDriverModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

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
    if (driverToEdit) {
      form.reset({
        firstName: driverToEdit.firstName,
        lastName: driverToEdit.lastName,
        email: driverToEdit.email, // Email should not be editable for existing user in Firestore auth
        employeeType: driverToEdit.employeeType,
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        employeeType: undefined,
      });
    }
  }, [driverToEdit, form, isOpen]);


  async function onSubmit(data: AddDriverFormValues | EditDriverFormValues) {
    setIsLoading(true);
    try {
      if (isEditing && driverToEdit) {
        // Update existing driver's Firestore profile
        const driverRef = doc(db, "users", driverToEdit.uid);
        await updateDoc(driverRef, {
          firstName: data.firstName,
          lastName: data.lastName,
          // email: data.email, // Firebase Auth email is source of truth, don't update here unless also updating Auth
          employeeType: data.employeeType,
        });
        toast({ title: "Success", description: "Driver profile updated successfully." });
      } else {
        // Add new driver
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
          title: "Driver Created",
          description: `${addData.firstName} ${addData.lastName} added. Password: ${addData.password} (Please communicate securely and advise driver to change it).`,
          duration: 10000,
        });
      }
      form.reset();
      setIsOpen(false);
      if (onClose) onClose();
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} driver:`, error);
      toast({ variant: "destructive", title: "Error", description: error.message || `Could not ${isEditing ? 'update' : 'add'} driver.` });
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
      {!driverToEdit && ( // Only show DialogTrigger if not controlled for editing
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" /> Add New Driver
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Driver Profile" : "Add New Driver"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the driver's details." : "Enter the details for the new driver. The driver will use this email and password to log in."}
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
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input placeholder="John" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input placeholder="Doe" {...field} /></FormControl>
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
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="driver@example.com" {...field} disabled={isEditing} /></FormControl>
                  {isEditing && <p className="text-xs text-muted-foreground">Email cannot be changed for existing users.</p>}
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
                    <FormLabel>Password</FormLabel>
                     <FormControl>
                        <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
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
                  <FormLabel>Employee Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employeeTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); if (onClose) onClose(); }}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Edit3 className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />)}
                {isEditing ? "Save Changes" : "Add Driver"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
