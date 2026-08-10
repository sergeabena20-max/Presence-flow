import { UserRole } from "@prisma/client";

/**
 * Session types for authentication
 */
export interface Session {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
  };
}

/**
 * User DTO for API responses
 */
export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  matricule: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User input for registration
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
}

/**
 * Attendance DTO for API responses
 */
export interface AttendanceDTO {
  id: string;
  userId: string;
  date: Date;
  arrivalTime?: Date;
  departureTime?: Date;
  arrivalStatus?: string;
  arrivalLat?: number;
  arrivalLon?: number;
  arrivalDistance?: number;
  departureLat?: number;
  departureLon?: number;
  departureDistance?: number;
  createdAt: Date;
  updatedAt: Date;
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

/**
 * Leave types for leave management
 */
export interface LeaveDTO {
  id: string;
  userId: string;
  leaveType: "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "OTHER";
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approverEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create leave input
 */
export interface CreateLeaveInput {
  userId: string;
  leaveType: "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "OTHER";
  startDate: Date;
  endDate: Date;
  reason?: string;
}

/**
 * Update leave input
 */
export interface UpdateLeaveInput {
  leaveType?: "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "OTHER";
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approverEmail?: string;
}

/**
 * Department types
 */
export interface DepartmentDTO {
  id: string;
  name: string;
  description?: string;
  managerEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create department input
 */
export interface CreateDepartmentInput {
  name: string;
  description?: string;
  managerEmail?: string;
}

/**
 * Update department input
 */
export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
  managerEmail?: string;
}
