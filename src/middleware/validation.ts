import { Request, Response, NextFunction } from "express";
import { AppointmentType, PaymentStatus } from "../types";

/**
 * Validation middleware for booking and payment requests
 */

/**
 * Validate booking creation request
 */
export const validateBookingRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { userPhone, userName, appointmentType, appointmentDate } = req.body;
  const errors: string[] = [];

  // Validate required fields
  if (!userPhone || typeof userPhone !== "string") {
    errors.push("userPhone is required and must be a string");
  }

  if (!userName || typeof userName !== "string") {
    errors.push("userName is required and must be a string");
  }

  if (!appointmentType || typeof appointmentType !== "string") {
    errors.push("appointmentType is required and must be a string");
  }

  if (!appointmentDate || typeof appointmentDate !== "string") {
    errors.push("appointmentDate is required and must be a string");
  }

  // Validate phone number format (basic validation)
  if (userPhone && !/^\+?[\d\s\-\(\)]+$/.test(userPhone)) {
    errors.push("userPhone must be a valid phone number format");
  }

  // Validate appointment date format (ISO 8601)
  if (appointmentDate) {
    const date = new Date(appointmentDate);
    if (isNaN(date.getTime())) {
      errors.push("appointmentDate must be a valid ISO 8601 date string");
    }
  }

  // Validate appointment type
  const validAppointmentTypes = Object.values(AppointmentType);

  if (
    appointmentType &&
    !validAppointmentTypes.includes(appointmentType as AppointmentType)
  ) {
    errors.push(
      `appointmentType must be one of: ${validAppointmentTypes.join(", ")}`
    );
  }

  // Validate userName length
  if (userName && (userName.length < 2 || userName.length > 100)) {
    errors.push("userName must be between 2 and 100 characters");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      message: "Please correct the following errors:",
      details: errors,
    });
    return;
  }

  next();
};

/**
 * Validate payment status update request
 */
export const validatePaymentStatusUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { paymentStatus, paymentId, amount, currency } = req.body;
  const errors: string[] = [];

  // Validate required fields
  if (!paymentStatus || typeof paymentStatus !== "string") {
    errors.push("paymentStatus is required and must be a string");
  }

  // Validate payment status values
  const validPaymentStatuses = Object.values(PaymentStatus);
  if (
    paymentStatus &&
    !validPaymentStatuses.includes(paymentStatus as PaymentStatus)
  ) {
    errors.push(
      `paymentStatus must be one of: ${validPaymentStatuses.join(", ")}`
    );
  }

  // Validate paymentId if provided
  if (paymentId && typeof paymentId !== "string") {
    errors.push("paymentId must be a string");
  }

  // Validate amount if provided
  if (amount !== undefined) {
    if (typeof amount !== "number" || amount < 0) {
      errors.push("amount must be a positive number");
    }
  }

  // Validate currency if provided
  if (currency && typeof currency !== "string") {
    errors.push("currency must be a string");
  }

  // Validate currency format (ISO 4217)
  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    errors.push(
      "currency must be a valid 3-letter ISO 4217 currency code (e.g., USD, EUR)"
    );
  }

  // Business logic validations
  if (paymentStatus === PaymentStatus.COMPLETED && !paymentId) {
    errors.push("paymentId is required when payment status is completed");
  }

  if (paymentStatus === PaymentStatus.COMPLETED && amount === undefined) {
    errors.push("amount is required when payment status is completed");
  }

  if (amount !== undefined && !currency) {
    errors.push("currency is required when amount is provided");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      message: "Please correct the following errors:",
      details: errors,
    });
    return;
  }

  next();
};

/**
 * Validate UUID parameter
 */
export const validateUUID = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { uuid } = req.params;

  // UUID v4 regex pattern
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid || !uuidPattern.test(uuid)) {
    res.status(400).json({
      success: false,
      error: "Invalid UUID",
      message: "The provided UUID is not in a valid format",
    });
    return;
  }

  next();
};

/**
 * Validate nanoid parameter for magic links
 */
export const validateNanoId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { nanoid } = req.params;

  // Nanoid pattern (URL-safe characters, typically 10-21 characters)
  const nanoidPattern = /^[A-Za-z0-9_-]{10,21}$/;

  if (!nanoid || !nanoidPattern.test(nanoid)) {
    res.status(400).json({
      success: false,
      error: "Invalid magic link ID",
      message: "The provided magic link ID is not in a valid format",
    });
    return;
  }

  next();
};

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      // Basic XSS prevention - remove script tags and escape HTML
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/[<>]/g, (match) => (match === "<" ? "&lt;" : "&gt;"))
        .trim();
    }
    if (typeof obj === "object" && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  next();
};
