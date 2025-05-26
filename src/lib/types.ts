import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'driver';

export type EmployeeType = "Vollzeit Mitarbeiter" | "Aushilfe" | "Sonstiges";
export const employeeTypes: EmployeeType[] = ["Vollzeit Mitarbeiter", "Aushilfe", "Sonstiges"];

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  employeeType?: EmployeeType; // Optional for admins, required for drivers
  createdAt: Timestamp;
}

export interface Taxi {
  id: string; // Corresponds to Firestore document ID, can be normalized license plate
  licensePlate: string;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string; // UID of admin who added it
}

export interface Shift {
  id: string; // Corresponds to Firestore document ID
  taxiId: string;
  taxiLicensePlate: string; // Denormalized for display
  driverId: string;
  driverFirstName: string; // Denormalized
  driverLastName: string; // Denormalized
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
}

// For forms
export interface ShiftFormData {
  taxiId: string;
  dates: Date[];
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
}
