// Type definitions for the Textbook Backend application

// Enum types (matching Prisma schema)
export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  TUTORIAL = 'TUTORIAL',
  ASSESSMENT = 'ASSESSMENT',
  GROUP_SESSION = 'GROUP_SESSION',
  WORKSHOP = 'WORKSHOP'
}

export enum BookingStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

// Base Booking interface (matching Prisma model)
export interface Booking {
  id: string;
  bookingId: string;
  magicLinkId: string;
  userName: string;
  userPhone: string;
  appointmentType: AppointmentType;
  appointmentDate: Date;
  bookingDetails: Record<string, any>;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string | null;
  paymentAmount?: number | null;
  paymentCurrency?: string | null;
  createdAt: Date;
  confirmedAt?: Date | null;
  paymentUpdatedAt?: Date | null;
  lastAccessedAt?: Date | null;
  accessCount: number;
}

// BookingAnalytics interface
export interface BookingAnalytics {
  id: string;
  bookingId: string;
  eventType: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  timestamp: Date;
}

// API Request/Response types
export interface CreateBookingRequest {
  userPhone: string;
  userName: string;
  appointmentType: AppointmentType;
  appointmentDate: string;
  bookingDetails?: Record<string, any>;
}

export interface CreateBookingResponse {
  success: boolean;
  data?: {
    bookingId: string;
    uuid: string;
    magicLinkId: string;
    magicLink: string;
    status: BookingStatus;
    message: string;
  };
  error?: string;
  message?: string;
}

export interface UpdatePaymentRequest {
  paymentStatus: PaymentStatus;
  paymentId?: string;
  amount?: number;
  currency?: string;
}

export interface UpdatePaymentResponse {
  success: boolean;
  data?: {
    bookingId: string;
    uuid: string;
    paymentStatus: PaymentStatus;
    message: string;
  };
  error?: string;
  message?: string;
}

export interface BookingResponse {
  success: boolean;
  data?: {
    bookingId: string;
    uuid: string;
    userName: string;
    userPhone: string;
    appointmentType: AppointmentType;
    appointmentDate: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
    confirmedAt?: string;
    bookingDetails: Record<string, any>;
    magicLinkId: string;
  };
  error?: string;
  message?: string;
}

export interface MagicLinkPreviewResponse {
  success: boolean;
  data?: {
    uuid: string;
    bookingId: string;
    userName: string;
    appointmentType: AppointmentType;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    redirectUrl: string;
    magicLink: string;
    createdAt: string;
  };
  error?: string;
  message?: string;
}

export interface TrackEventRequest {
  event?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
}

// Environment variables type
export interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  DIRECT_URL?: string;
  FRONTEND_BASE_URL: string;
  MAGIC_LINK_BASE_URL: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS?: number;
  RATE_LIMIT_MAX_REQUESTS?: number;
}

// Extended Express Request type (will be properly typed when express types are available)
export interface AuthenticatedRequest {
  user?: any; // For future authentication
  body: any;
  params: any;
  query: any;
  headers: any;
  ip: string;
  protocol: string;
  get: (name: string) => string | undefined;
}

// Booking with relations type
export type BookingWithAnalytics = Booking & {
  analytics: BookingAnalytics[];
};

// Booking creation data type
export interface BookingCreateData {
  bookingId: string;
  magicLinkId: string;
  userName: string;
  userPhone: string;
  appointmentType: AppointmentType;
  appointmentDate: Date;
  bookingDetails: Record<string, any>;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
}

// Magic link data type
export interface MagicLinkData {
  uuid: string;
  bookingId: string;
  magicLinkId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  userName?: string;
}

// Analytics event type
export interface AnalyticsEvent {
  bookingId: string;
  eventType: string;
  userAgent?: string;
  ipAddress?: string;
} 