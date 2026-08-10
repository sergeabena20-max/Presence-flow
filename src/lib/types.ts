import { UserRole, AttendanceStatus } from "@prisma/client";

/**
 * Session user shape exposed by NextAuth (see src/lib/auth.ts)
 */
export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * User DTO for API responses
 */
export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  matricule: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User input for creation
 */
export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  matricule: string;
  password: string;
  role?: UserRole;
}

/**
 * User input for update
 */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  matricule?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

/**
 * Attendance DTO for API responses
 */
export interface AttendanceDTO {
  id: string;
  userId: string;
  date: Date;
  arrivalTime?: Date | null;
  departureTime?: Date | null;
  arrivalStatus?: AttendanceStatus | null;
  arrivalLat?: number | null;
  arrivalLon?: number | null;
  arrivalDistance?: number | null;
  departureLat?: number | null;
  departureLon?: number | null;
  departureDistance?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input to sign an arrival
 */
export interface SignArrivalInput {
  latitude: number;
  longitude: number;
}

/**
 * Input to sign a departure
 */
export interface SignDepartureInput {
  latitude: number;
  longitude: number;
}

/**
 * Settings DTO
 */
export interface SettingsDTO {
  id: string;
  facilityName: string;
  address: string;
  latitude: number;
  longitude: number;
  gpsRadius: number;
  officialArrivalTime: Date;
  arrivalTolerance: number;
  officialDepartureTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input to update settings
 */
export interface UpdateSettingsInput {
  facilityName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  gpsRadius?: number;
  officialArrivalTime?: string; // HH:mm
  arrivalTolerance?: number;
  officialDepartureTime?: string; // HH:mm
}

/**
 * Permission names available for ADMIN accounts
 */
export type PermissionName =
  | "MANAGE_USERS"
  | "VIEW_ATTENDANCE"
  | "MANAGE_SETTINGS"
  | "VIEW_STATISTICS";

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
