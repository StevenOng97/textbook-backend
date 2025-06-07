import express, { Request, Response, Router } from 'express';
import prisma from '../config/database';
import { validateNanoId } from '../middleware/validation';
import { 
  MagicLinkPreviewResponse,
  TrackEventRequest,
  ApiResponse
} from '../types';
import { AppointmentType, BookingStatus, PaymentStatus } from '@prisma/client';

const router: Router = express.Router();

/**
 * GET /appt/:magicLinkId
 * Magic link handler - lookup nanoid and redirect to frontend
 * 
 * This route handles the magic link clicks from users:
 * 1. Receives the nanoid from the magic link
 * 2. Looks up the booking in database
 * 3. Redirects to the frontend with the bookingId
 */
router.get('/:magicLinkId', async (req: Request, res: Response) => {
  try {
    const { magicLinkId } = req.params;

    if (!magicLinkId) {
      return res.status(400).json({
        success: false,
        error: 'Missing magic link ID',
        message: 'Magic link ID parameter is required.'
      });
    }

    // Lookup magic link ID in database to get booking
    const booking = await prisma.booking.findUnique({
      where: { magicLinkId },
      select: {
        id: true,
        bookingId: true,
        status: true,
        paymentStatus: true,
        userName: true,
        accessCount: true
      }
    });

    if (!booking) {
      console.error('Booking lookup error: Not found for magic link ID:', magicLinkId);
      
      // Redirect to error page
      const errorUrl = `${process.env.FRONTEND_BASE_URL || 'https://usetextbook.com'}/booking/error?reason=not_found`;
      return res.redirect(errorUrl);
    }

    // Log the magic link access for analytics/tracking
    console.log(`🔗 Magic link accessed for booking ${booking.bookingId} by ${booking.userName || 'Unknown'}`);

    // Update access count and last accessed timestamp
    await prisma.booking.update({
      where: { magicLinkId },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    });

    // Optional: Track analytics event
    try {
      await prisma.bookingAnalytics.create({
        data: {
          bookingId: booking.id,
          eventType: 'magic_link_click',
          userAgent: req.get('User-Agent') || null,
          ipAddress: req.ip || null
        }
      });
    } catch (analyticsError) {
      console.warn('Failed to track analytics event:', analyticsError);
    }

    // Redirect to frontend with bookingId
    // Format: https://usetextbook.com/booking/{bookingId}
    const frontendUrl = `${process.env.FRONTEND_BASE_URL || 'https://usetextbook.com'}/booking/${booking.bookingId}`;
    
    // Add query parameters for additional context
    const urlParams = new URLSearchParams({
      status: booking.status,
      payment_status: booking.paymentStatus,
      source: 'magic_link'
    });

    const redirectUrl = `${frontendUrl}?${urlParams.toString()}`;
    
    console.log(`🚀 Redirecting to: ${redirectUrl}`);
    
    // Perform the redirect
    res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('Magic link redirect error:', error);
    
    // Redirect to error page
    const errorUrl = `${process.env.FRONTEND_BASE_URL || 'https://usetextbook.com'}/booking/error?reason=server_error`;
    res.redirect(errorUrl);
  }
});

/**
 * GET /appt/:magicLinkId/preview
 * Preview magic link destination without redirecting
 * Useful for debugging or link preview generation
 */
router.get('/:magicLinkId/preview', validateNanoId, async (req: Request, res: Response<MagicLinkPreviewResponse>) => {
  try {
    const { magicLinkId } = req.params;

    if (!magicLinkId) {
      return res.status(400).json({
        success: false,
        error: 'Missing magic link ID',
        message: 'Magic link ID parameter is required.'
      });
    }

    // Lookup magic link ID in database
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

    // Generate the redirect URL that would be used
    const frontendUrl = `${process.env.FRONTEND_BASE_URL || 'https://usetextbook.com'}/booking/${booking.bookingId}`;
    const urlParams = new URLSearchParams({
      status: booking.status,
      payment_status: booking.paymentStatus,
      source: 'magic_link'
    });
    const redirectUrl = `${frontendUrl}?${urlParams.toString()}`;

    res.status(200).json({
      success: true,
      data: {
        uuid: booking.id,
        bookingId: booking.bookingId,
        userName: booking.userName,
        appointmentType: booking.appointmentType as any,
        status: booking.status as any,
        paymentStatus: booking.paymentStatus as any,
        redirectUrl: redirectUrl,
        magicLink: `${req.protocol}://${req.get('host')}/appt/${magicLinkId}`,
        createdAt: booking.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Magic link preview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while previewing the magic link.'
    });
  }
});

/**
 * POST /appt/:magicLinkId/track
 * Track magic link interactions for analytics
 */
router.post('/:magicLinkId/track', validateNanoId, async (req: Request<{ magicLinkId: string }, ApiResponse, TrackEventRequest>, res: Response<ApiResponse>) => {
  try {
    const { magicLinkId } = req.params;
    const { event, userAgent, ipAddress } = req.body;

    if (!magicLinkId) {
      return res.status(400).json({
        success: false,
        error: 'Missing magic link ID',
        message: 'Magic link ID parameter is required.'
      });
    }

    // Find the booking by magic link ID
    const booking = await prisma.booking.findUnique({
      where: { magicLinkId },
      select: { id: true, bookingId: true }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'Unable to find booking with the provided magic link ID.'
      });
    }

    // Log the tracking event
    console.log(`📊 Tracking event for ${booking.bookingId}: ${event || 'interaction'}`);

    // Store tracking data in analytics table
    await prisma.bookingAnalytics.create({
      data: {
        bookingId: booking.id,
        eventType: event || 'interaction',
        userAgent: userAgent || req.get('User-Agent') || null,
        ipAddress: ipAddress || req.ip || null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Event tracked successfully.'
    });

  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while tracking the event.'
    });
  }
});

/**
 * GET /appt/:magicLinkId/analytics
 * Get analytics data for a magic link
 */
router.get('/:magicLinkId/analytics', validateNanoId, async (req: Request, res: Response) => {
  try {
    const { magicLinkId } = req.params;

    if (!magicLinkId) {
      return res.status(400).json({
        success: false,
        error: 'Missing magic link ID',
        message: 'Magic link ID parameter is required.'
      });
    }

    // Find the booking and its analytics
    const booking = await prisma.booking.findUnique({
      where: { magicLinkId },
      include: {
        analytics: {
          orderBy: { timestamp: 'desc' },
          take: 50 // Limit to last 50 events
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        message: 'Unable to find booking with the provided magic link ID.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        accessCount: booking.accessCount,
        lastAccessedAt: booking.lastAccessedAt?.toISOString(),
        analytics: booking.analytics.map(event => ({
          eventType: event.eventType,
          timestamp: event.timestamp.toISOString(),
          userAgent: event.userAgent,
          ipAddress: event.ipAddress
        }))
      }
    });

  } catch (error) {
    console.error('Analytics retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while retrieving analytics data.'
    });
  }
});

export default router; 