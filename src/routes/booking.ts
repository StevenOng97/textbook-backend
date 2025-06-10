import express, { Request, Response, Router } from 'express';
import { nanoid } from 'nanoid';
import prisma from '../config/database';
import { calculateMagicLinkExpiration } from '../utils/magicLink';
import { 
  validateBookingRequest, 
  validatePaymentStatusUpdate 
} from '../middleware/validation';
import { 
  CreateBookingRequest, 
  CreateBookingResponse,
  UpdatePaymentRequest,
  UpdatePaymentResponse,
  BookingResponse,
  AppointmentType,
  BookingStatus,
  PaymentStatus
} from '../types';

const router: Router = express.Router();

/**
 * POST /api/booking/create
 * Create a new booking and generate magic link
 */
router.post('/create', validateBookingRequest, async (req: Request<{}, CreateBookingResponse, CreateBookingRequest>, res: Response<CreateBookingResponse>) => {
  try {
    const { userPhone, userName, appointmentType, appointmentDate, bookingDetails } = req.body;
    
    // Generate unique identifiers
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const magicLinkId = nanoid(12); // Generate 12-character nanoid for magic link
    
    // Set magic link expiration to 1 hour from now
    const magicLinkExpiresAt = calculateMagicLinkExpiration();
    
    // Create booking record in database using Prisma
    const booking = await prisma.booking.create({
      data: {
        bookingId,
        magicLinkId,
        userName,
        userPhone,
        appointmentType: appointmentType as AppointmentType,
        appointmentDate: new Date(appointmentDate),
        bookingDetails: bookingDetails || {},
        status: BookingStatus.PENDING_CONFIRMATION,
        paymentStatus: PaymentStatus.PENDING,
        magicLinkExpiresAt,
      }
    });

    // Generate magic link using nanoid
    const magicLink = `${process.env.MAGIC_LINK_BASE_URL || 'https://tbook.me'}/appt/${magicLinkId}`;
    
    // In a real application, you would send this confirmation to the user
    // via SMS, email, or your preferred notification service
    console.log(`📱 Send confirmation to ${userPhone}: Your appointment is booked! Confirm here: ${magicLink}`);
    
    return res.status(201).json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        uuid: booking.id,
        magicLinkId: booking.magicLinkId,
        magicLink,
        status: booking.status as BookingStatus,
        message: 'Booking created successfully. Confirmation link sent to user.'
      }
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the booking.'
    });
  }
});

/**
 * POST /api/booking/confirm/:uuid
 * Confirm an appointment (simulates user confirmation)
 */
router.post('/confirm/:uuid', async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        error: 'Missing UUID',
        message: 'UUID parameter is required.'
      });
    }

    // Update booking status to confirmed
    const booking = await prisma.booking.update({
      where: { id: uuid },
      data: { 
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        uuid: booking.id,
        status: booking.status,
        message: 'Appointment confirmed successfully.'
      }
    });

  } catch (error) {
    console.error('Booking confirmation error:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'Unable to find booking with the provided UUID.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while confirming the booking.'
    });
  }
});

/**
 * PUT /api/booking/payment/:uuid
 * Update payment status for a booking
 */
router.put('/payment/:uuid', validatePaymentStatusUpdate, async (req: Request<{ uuid: string }, UpdatePaymentResponse, UpdatePaymentRequest>, res: Response<UpdatePaymentResponse>) => {
  try {
    const { uuid } = req.params;
    const { paymentStatus, paymentId, amount, currency } = req.body;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        error: 'Missing UUID',
        message: 'UUID parameter is required.'
      });
    }

    // Update payment status in database
    const booking = await prisma.booking.update({
      where: { id: uuid },
      data: { 
        paymentStatus: paymentStatus as PaymentStatus,
        paymentId,
        paymentAmount: amount,
        paymentCurrency: currency,
        paymentUpdatedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        uuid: booking.id,
        paymentStatus: booking.paymentStatus as PaymentStatus,
        message: 'Payment status updated successfully.'
      }
    });

  } catch (error) {
    console.error('Payment status update error:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'Unable to find booking with the provided UUID.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while updating payment status.'
    });
  }
});

/**
 * GET /api/booking/:uuid
 * Retrieve booking details by UUID
 */
router.get('/:id', async (req: Request, res: Response<BookingResponse>) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing UUID',
        message: 'UUID parameter is required.'
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'Unable to find booking with the provided UUID.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        id: booking.id,
        userName: booking.userName,
        userPhone: booking.userPhone,
        appointmentType: booking.appointmentType as AppointmentType,
        appointmentDate: booking.appointmentDate.toISOString(),
        status: booking.status as BookingStatus,
        paymentStatus: booking.paymentStatus as PaymentStatus,
        createdAt: booking.createdAt.toISOString(),
        confirmedAt: booking.confirmedAt?.toISOString(),
        bookingDetails: booking.bookingDetails as Record<string, any>,
        magicLinkId: booking.magicLinkId,
        isExpired: booking.magicLinkExpiresAt && new Date() > booking.magicLinkExpiresAt || false
      }
    });

  } catch (error) {
    console.error('Booking retrieval error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while retrieving the booking.'
    });
  }
});

/**
 * GET /api/booking/magic/:magicLinkId
 * Retrieve booking details by magic link ID (nanoid)
 */
router.get('/magic/:magicLinkId', async (req: Request, res: Response) => {
  try {
    const { magicLinkId } = req.params;

    if (!magicLinkId) {
      return res.status(400).json({
        success: false,
        error: 'Missing magic link ID',
        message: 'Magic link ID parameter is required.'
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { magicLinkId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'Unable to find booking with the provided magic link ID.'
      });
    }

    // Check if magic link has expired
    if (booking.magicLinkExpiresAt && new Date() > booking.magicLinkExpiresAt) {
      return res.status(410).json({
        success: false,
        error: 'Magic link expired',
        message: 'This magic link has expired and is no longer valid.'
      });
    }

    // Update access count and last accessed time
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        uuid: booking.id,
        userName: booking.userName,
        userPhone: booking.userPhone,
        appointmentType: booking.appointmentType as AppointmentType,
        appointmentDate: booking.appointmentDate.toISOString(),
        status: booking.status as BookingStatus,
        paymentStatus: booking.paymentStatus as PaymentStatus,
        createdAt: booking.createdAt.toISOString(),
        confirmedAt: booking.confirmedAt?.toISOString(),
        bookingDetails: booking.bookingDetails as Record<string, any>,
        magicLinkId: booking.magicLinkId
      }
    });

  } catch (error) {
    console.error('Booking retrieval by magic link error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while retrieving the booking.'
    });
  }
});

export default router; 