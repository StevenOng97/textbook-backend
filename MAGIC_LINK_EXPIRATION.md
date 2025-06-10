# Magic Link Expiration Implementation

This document describes the implementation of 1-hour magic link expiration for the textbook booking system.

## Overview

Magic links now expire after 1 hour from creation to enhance security and prevent stale link usage. When users attempt to access an expired magic link, they will be redirected to an error page with an appropriate message.

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)

Added a new field to track magic link expiration:

```prisma
model Booking {
  // ... existing fields ...
  magicLinkExpiresAt DateTime @map("magic_link_expires_at") @db.Timestamptz(6)
  // ... rest of fields ...
  
  @@index([magicLinkExpiresAt])  // Added index for performance
}
```

### 2. Utility Functions (`src/utils/magicLink.ts`)

Created utility functions for magic link expiration handling:

- `calculateMagicLinkExpiration()`: Returns expiration date (1 hour from now)
- `isMagicLinkExpired(date)`: Checks if a magic link has expired
- `getTimeUntilExpiration(date)`: Gets remaining time in milliseconds
- `formatTimeRemaining(date)`: Returns human-readable time format

### 3. Booking Creation Updates (`src/routes/booking.ts`)

Updated booking creation to set expiration time:

```typescript
// Set magic link expiration to 1 hour from now
const magicLinkExpiresAt = calculateMagicLinkExpiration();

const booking = await prisma.booking.create({
  data: {
    // ... other fields ...
    magicLinkExpiresAt,
  }
});
```

### 4. Magic Link Access Updates (`src/routes/redirect.ts`)

Enhanced magic link handlers to check expiration:

#### Main Redirect Route (`GET /appt/:magicLinkId`)
- Checks expiration before processing
- Redirects to error page if expired
- Tracks expired access attempts in analytics

#### Preview Route (`GET /appt/:magicLinkId/preview`)
- Returns 410 Gone status for expired links
- Includes expiration information in response

#### Magic Link API (`GET /api/booking/magic/:magicLinkId`)
- Returns 410 Gone status for expired links
- Prevents data access through expired links

### 5. Analytics Enhancement

Added tracking for expired magic link access attempts:
- Event type: `magic_link_expired_access`
- Includes user agent and IP address
- Helps monitor expired link usage patterns

## Implementation Steps

### Step 1: Database Schema Update

Run the following commands to update your database:

```bash
# Generate Prisma client with new schema
npx prisma generate

# Push schema changes to database
npx prisma db push

# Optional: Run new seed data with expiration
npm run db:seed
```

### Step 2: Build and Deploy

```bash
# Build the TypeScript code
npm run build

# Start the server
npm start
```

### Step 3: Test the Implementation

#### Manual Testing

1. **Create a new booking:**
   ```bash
   curl -X POST http://localhost:3000/api/booking/create \
     -H "Content-Type: application/json" \
     -d '{
       "userPhone": "+1234567890",
       "userName": "Test User",
       "appointmentType": "CONSULTATION",
       "appointmentDate": "2024-12-31T15:00:00Z"
     }'
   ```

2. **Test magic link immediately (should work):**
   ```bash
   curl -L http://localhost:3000/appt/{magicLinkId}
   ```

3. **Test expiration checking:**
   ```bash
   # Preview magic link to see expiration info
   curl http://localhost:3000/appt/{magicLinkId}/preview
   ```

## Error Handling

### Expired Magic Link Responses

**Redirect Route (GET /appt/:magicLinkId):**
- Redirects to: `{FRONTEND_BASE_URL}/booking/error?reason=expired`
- HTTP Status: 302 (Redirect)

**API Routes:**
- HTTP Status: 410 Gone
- Response body:
  ```json
  {
    "success": false,
    "error": "Magic link expired",
    "message": "This magic link has expired and is no longer valid."
  }
  ```

### Frontend Integration

Update your frontend to handle the expired link error:

```typescript
// Handle expired magic link redirect
if (window.location.search.includes('reason=expired')) {
  // Show expired link message
  // Offer option to request new magic link
}
```

## Configuration

### Expiration Time

The expiration time is currently set to 1 hour. To modify this, update the utility function:

```typescript
// In src/utils/magicLink.ts
export function calculateMagicLinkExpiration(): Date {
  // Change this value to adjust expiration time
  const EXPIRATION_HOURS = 1;
  return new Date(Date.now() + EXPIRATION_HOURS * 60 * 60 * 1000);
}
```

### Environment Variables

No additional environment variables are required for this feature.

## Analytics and Monitoring

### New Analytics Events

- `magic_link_expired_access`: Tracked when users attempt to access expired links
- Includes standard tracking data (user agent, IP address, timestamp)

### Database Queries

The implementation adds an index on `magicLinkExpiresAt` for efficient expiration queries.

## Security Considerations

### Benefits
- **Time-limited Access**: Prevents indefinite access through shared links
- **Reduced Attack Surface**: Expired links cannot be used maliciously
- **Analytics Tracking**: Monitor expired link access patterns

### Recommendations
- Monitor expired link access rates
- Consider implementing link regeneration for legitimate users
- Add rate limiting for magic link creation if not already present

## Future Enhancements

### Possible Improvements
1. **Configurable Expiration**: Allow different expiration times per booking type
2. **Grace Period**: Provide a short grace period after expiration
3. **Link Regeneration**: API endpoint to regenerate expired magic links
4. **Email Notifications**: Notify users before links expire
5. **Cleanup Job**: Periodic cleanup of expired booking data

### Database Cleanup

Consider implementing a cleanup job for old expired bookings:

```typescript
// Example cleanup function
async function cleanupExpiredBookings() {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  
  await prisma.booking.deleteMany({
    where: {
      magicLinkExpiresAt: {
        lt: cutoffDate
      },
      status: {
        in: ['CANCELLED', 'COMPLETED']
      }
    }
  });
}
```

## Troubleshooting

### Common Issues

1. **Prisma Client Errors**: Ensure you've run `npx prisma generate` after schema changes
2. **Database Connection**: Verify database connection and schema is updated
3. **Timezone Issues**: All timestamps use UTC (Timestamptz) for consistency

### Testing Expired Links

To test expired links without waiting:

1. Manually update database record:
   ```sql
   UPDATE bookings 
   SET magic_link_expires_at = NOW() - INTERVAL '1 hour' 
   WHERE magic_link_id = 'your_test_id';
   ```

2. Or create a test utility with past expiration time

## Migration Notes

### Existing Data

For existing bookings without expiration dates:
- They will be treated as non-expiring (legacy behavior)
- Consider setting expiration dates for active bookings
- Update seed data to include expiration times

### Backward Compatibility

The implementation maintains backward compatibility:
- Existing magic links without expiration dates continue to work
- No breaking changes to existing API endpoints
- Graceful handling of null expiration dates 