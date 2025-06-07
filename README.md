# Textbook Backend - Magic Link Booking System

A TypeScript Node.js/Express.js backend application that implements a magic link booking system with Prisma ORM and PostgreSQL. This system allows users to book appointments via SMS/text, receive magic links for confirmation, and complete payments through a seamless flow.

## 🚀 Features

- **TypeScript**: Full type safety and modern development experience
- **Prisma ORM**: Type-safe database access with auto-generated client
- **Magic Link Generation**: Creates unique magic links using nanoid for booking confirmations
- **PostgreSQL Integration**: Full database integration with PostgreSQL (Supabase compatible)
- **Booking Management**: Create, confirm, and track bookings
- **Payment Status Tracking**: Handle payment status updates
- **Security**: Rate limiting, input validation, and CORS protection
- **Analytics**: Track magic link interactions and access patterns
- **RESTful API**: Clean, documented API endpoints with full TypeScript support

## 📋 Flow Overview

```
User Texts → System Books Appointment → Generate bookingId + nanoid
    ↓
Store in Database (bookings table with UUID + magic_link_id)
    ↓
Generate Magic Link (https://tbook.me/appt/{nanoid})
    ↓
Send Confirmation to User → User Confirms → User Clicks Magic Link
    ↓
Lookup nanoid in Database → Get bookingId
    ↓
Redirect to Frontend (usetextbook.com/booking/{bookingId})
    ↓
User Completes Payment → Update Payment Status in Database
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd textbook-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory (see `config.example` for reference):
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database Configuration (Prisma)
   DATABASE_URL=postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres
   DIRECT_URL=postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres
   
   # Frontend URLs
   FRONTEND_BASE_URL=https://usetextbook.com
   MAGIC_LINK_BASE_URL=https://tbook.me
   
   # CORS Configuration
   CORS_ORIGIN=*
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push the schema to your database
   npm run db:push
   
   # Optional: Seed the database with sample data
   npm run db:seed
   ```

5. **Build and start the server**
   ```bash
   # Build TypeScript
   npm run build
   
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 🗃️ Database Schema

The database schema is defined using Prisma and includes the following main models:

### Booking Model
```prisma
model Booking {
  id              String          @id @default(uuid()) @db.Uuid
  bookingId       String          @unique @map("booking_id")
  magicLinkId     String          @unique @map("magic_link_id") // nanoid for magic links
  userName        String          @map("user_name")
  userPhone       String          @map("user_phone")
  appointmentType AppointmentType @map("appointment_type")
  appointmentDate DateTime        @map("appointment_date")
  bookingDetails  Json            @default("{}") @map("booking_details")
  status          BookingStatus   @default(PENDING_CONFIRMATION)
  paymentStatus   PaymentStatus   @default(PENDING) @map("payment_status")
  paymentId       String?         @map("payment_id")
  paymentAmount   Decimal?        @map("payment_amount")
  paymentCurrency String?         @map("payment_currency")
  createdAt       DateTime        @default(now()) @map("created_at")
  confirmedAt     DateTime?       @map("confirmed_at")
  paymentUpdatedAt DateTime?      @map("payment_updated_at")
  lastAccessedAt  DateTime?       @map("last_accessed_at")
  accessCount     Int             @default(0) @map("access_count")
  analytics       BookingAnalytics[]
  
  @@map("bookings")
}
```

### Key Features
- **UUID Primary Key**: Each booking has a unique UUID
- **Magic Link ID**: Short nanoid for user-friendly magic links
- **Type Safety**: Enums for appointment types, booking status, and payment status
- **Analytics Tracking**: Related analytics events for each booking
- **Flexible Details**: JSON field for additional booking information

## 📡 API Endpoints

### Health Check
```http
GET /health
```
Returns the server status and timestamp.

### Booking Management

#### Create Booking
```http
POST /api/booking/create
Content-Type: application/json

{
  "userPhone": "+1234567890",
  "userName": "John Doe",
  "appointmentType": "consultation",
  "appointmentDate": "2024-01-15T10:00:00Z",
  "bookingDetails": {
    "subject": "Mathematics",
    "level": "Advanced"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking_1705123456789_abc123def",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "magicLink": "https://tbook.me/appt/550e8400-e29b-41d4-a716-446655440000",
    "status": "pending_confirmation",
    "message": "Booking created successfully. Confirmation link sent to user."
  }
}
```

#### Confirm Booking
```http
POST /api/booking/confirm/{uuid}
```

#### Update Payment Status
```http
PUT /api/booking/payment/{uuid}
Content-Type: application/json

{
  "paymentStatus": "completed",
  "paymentId": "payment_xyz123",
  "amount": 100.00,
  "currency": "USD"
}
```

#### Get Booking Details
```http
GET /api/booking/{uuid}
```

### Magic Link Handling

#### Magic Link Redirect
```http
GET /appt/{magicLinkId}
```
Redirects to: `https://usetextbook.com/booking/{bookingId}?status=confirmed&payment_status=pending&source=magic_link`

#### Preview Magic Link
```http
GET /appt/{magicLinkId}/preview
```
Returns booking details and redirect URL without performing the redirect.

#### Track Magic Link Interactions
```http
POST /appt/{magicLinkId}/track
Content-Type: application/json

{
  "event": "link_click",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1"
}
```

#### Get Magic Link Analytics
```http
GET /appt/{magicLinkId}/analytics
```
Returns analytics data for the magic link including access count and event history.

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable origin restrictions
- **Input Validation**: Comprehensive request validation
- **XSS Prevention**: Input sanitization
- **Helmet.js**: Security headers
- **UUID Validation**: Proper UUID format checking

## 🏗️ Project Structure

```
textbook-backend/
├── src/
│   ├── config/
│   │   └── supabase.js          # Supabase client configuration
│   │   └── validation.js        # Request validation middleware
│   │   └── routes/
│   │   │   ├── booking.js           # Booking management routes
│   │   │   └── redirect.js          # Magic link redirect routes
│   │   └── server.js                # Main application server
│   ├── database/
│   │   └── schema.sql               # Supabase database schema
│   ├── package.json
│   └── README.md
```

## 🧪 Testing

### Manual Testing with cURL

**Create a booking:**
```bash
curl -X POST http://localhost:3000/api/booking/create \
  -H "Content-Type: application/json" \
  -d '{
    "userPhone": "+1234567890",
    "userName": "Test User",
    "appointmentType": "consultation",
    "appointmentDate": "2024-12-31T15:00:00Z"
  }'
```

**Test magic link redirect:**
```bash
curl -L http://localhost:3000/appt/{uuid-from-creation}
```

### Environment Variables for Testing

Create a `.env.test` file for testing:
```env
PORT=3001
SUPABASE_URL=your_test_supabase_url
SUPABASE_ANON_KEY=your_test_supabase_key
FRONTEND_BASE_URL=http://localhost:3000
MAGIC_LINK_BASE_URL=http://localhost:3001
```

## 🚀 Deployment

### Environment Setup
Ensure all environment variables are properly configured in your production environment.

### Supabase Configuration
1. Set up your production Supabase project
2. Run the schema from `database/schema.sql`
3. Configure Row Level Security (RLS) policies
4. Update environment variables with production URLs and keys

### Recommended Production Settings
```env
NODE_ENV=production
PORT=443
CORS_ORIGIN=https://usetextbook.com,https://tbook.me
```

## 📊 Monitoring and Analytics

The system includes built-in analytics tracking:
- Magic link access counts
- Booking status transitions
- Payment status updates
- Optional detailed analytics table for user interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please create an issue in the repository or contact the development team.

## 🔄 Version History

- **v1.0.0** - Initial release with magic link booking system
  - Booking creation and management
  - Magic link generation and redirect
  - Supabase integration
  - Payment status tracking 