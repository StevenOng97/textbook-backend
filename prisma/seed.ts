import { PrismaClient, AppointmentType, BookingStatus, PaymentStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import { calculateMagicLinkExpiration } from '../src/utils/magicLink';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample bookings
  const sampleBookings = [
    {
      bookingId: `booking_${Date.now()}_sample1`,
      magicLinkId: nanoid(12),
      userName: 'John Doe',
      userPhone: '+1234567890',
      appointmentType: AppointmentType.CONSULTATION,
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      bookingDetails: {
        subject: 'Mathematics',
        level: 'Advanced',
        duration: 60,
        notes: 'Student needs help with calculus'
      },
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentId: 'payment_sample_123',
      paymentAmount: 99.99,
      paymentCurrency: 'USD',
      confirmedAt: new Date(),
      paymentUpdatedAt: new Date(),
      accessCount: 3,
      magicLinkExpiresAt: calculateMagicLinkExpiration()
    },
    {
      bookingId: `booking_${Date.now()}_sample2`,
      magicLinkId: nanoid(12),
      userName: 'Jane Smith',
      userPhone: '+1987654321',
      appointmentType: AppointmentType.TUTORIAL,
      appointmentDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      bookingDetails: {
        subject: 'Physics',
        level: 'Intermediate',
        duration: 90,
        notes: 'Group tutorial session'
      },
      status: BookingStatus.PENDING_CONFIRMATION,
      paymentStatus: PaymentStatus.PENDING,
      accessCount: 1,
      magicLinkExpiresAt: calculateMagicLinkExpiration()
    },
    {
      bookingId: `booking_${Date.now()}_sample3`,
      magicLinkId: nanoid(12),
      userName: 'Bob Johnson',
      userPhone: '+1555123456',
      appointmentType: AppointmentType.ASSESSMENT,
      appointmentDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
      bookingDetails: {
        subject: 'Chemistry',
        level: 'Beginner',
        duration: 45,
        notes: 'Initial assessment for new student'
      },
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.FAILED,
      paymentId: 'payment_failed_456',
      confirmedAt: new Date(),
      paymentUpdatedAt: new Date(),
      accessCount: 0,
      magicLinkExpiresAt: calculateMagicLinkExpiration()
    }
  ];

  // Insert sample bookings
  for (const bookingData of sampleBookings) {
    const booking = await prisma.booking.create({
      data: bookingData
    });

    console.log(`✅ Created booking: ${booking.bookingId} (Magic Link: ${booking.magicLinkId})`);

    // Create some sample analytics events for each booking
    const analyticsEvents = [
      {
        bookingId: booking.id,
        eventType: 'magic_link_click',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.100'
      },
      {
        bookingId: booking.id,
        eventType: 'booking_view',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        ipAddress: '192.168.1.101'
      }
    ];

    // Only add analytics for bookings that have been accessed
    if (booking.accessCount > 0) {
      for (const eventData of analyticsEvents.slice(0, booking.accessCount)) {
        await prisma.bookingAnalytics.create({
          data: {
            ...eventData,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24 hours
          }
        });
      }
      console.log(`📊 Created ${Math.min(analyticsEvents.length, booking.accessCount)} analytics events for ${booking.bookingId}`);
    }
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample Magic Links:');
  
  // Display the magic links for testing
  const allBookings = await prisma.booking.findMany({
    select: {
      bookingId: true,
      magicLinkId: true,
      userName: true,
      status: true
    }
  });

  allBookings.forEach(booking => {
    console.log(`🔗 ${booking.userName}: https://tbook.me/appt/${booking.magicLinkId} (${booking.status})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 