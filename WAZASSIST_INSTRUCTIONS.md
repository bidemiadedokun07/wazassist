# WazAssist AI - Comprehensive Developer Instructions

**Version**: 1.0  
**Last Updated**: February 14, 2026  
**Status**: Production-Ready MVP (75% Complete)  
**Target Market**: Nigerian SMEs

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Current Implementation Status](#current-implementation-status)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Backend Services](#backend-services)
7. [Frontend Application](#frontend-application)
8. [Development Setup](#development-setup)
9. [API Endpoints](#api-endpoints)
10. [Key Features](#key-features)
11. [Demo Mode & Testing](#demo-mode--testing)
12. [Deployment](#deployment)
13. [Business Model](#business-model)
14. [Common Issues & Solutions](#common-issues--solutions)

---

## 📖 Project Overview

### What is WazAssist?

WazAssist AI is a **Production-Grade AI-Powered WhatsApp Business Assistant** designed specifically for Nigerian SMEs. It enables businesses to:

- **Automate customer interactions** via WhatsApp with AI responses
- **Process orders** automatically from customer messages
- **Accept payments** through Paystack and Flutterwave
- **Manage inventory** and track stock levels
- **Generate analytics** and business insights
- **Support multiple languages**: English, Pidgin, Yoruba, Igbo, Hausa

### Value Proposition

- **24/7 Availability**: Never miss a customer inquiry
- **Multilingual**: Speaks Nigerian languages naturally
- **Smart Order Processing**: AI extracts order details from conversations
- **Payment Integration**: Direct payment links via WhatsApp
- **Business Intelligence**: Track sales, customers, and trends
- **Scalable**: Built for AWS with serverless architecture

---

## 🏗️ Architecture & Technology Stack

### Backend Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **Language**: JavaScript (ES Modules)
- **Database**: PostgreSQL (Docker local, Aurora production)
- **Cache**: Redis (Not yet deployed locally, ElastiCache production)
- **Authentication**: JWT with refresh tokens
- **File Upload**: Multer with S3 integration
- **Logging**: Winston with CloudWatch integration

### AI/ML Integration

- **Primary LLM**: OpenAI GPT-4 (development)
- **Production LLM**: AWS Bedrock LLaMA 3.1 (8B/70B models)
- **Mode**: Mock AI mode enabled for development without API keys
- **Features**:
  - Business context awareness
  - Product recommendations
  - Order intent detection
  - Multi-language support
  - Conversation management

### Payment Providers

- **Paystack**: Primary payment gateway (Nigerian market leader)
- **Flutterwave**: Secondary payment option
- **Supported Methods**: Cards, Bank Transfer, USSD
- **Currency**: Nigerian Naira (NGN)
- **Mock Mode**: Enabled for testing without live credentials

### WhatsApp Integration

- **API**: Meta WhatsApp Cloud API (production)
- **Features**:
  - Send/receive text messages
  - Template messages
  - Media handling (images, documents)
  - Webhook verification
- **Mock Mode**: Enabled for development without WhatsApp Business API

### Frontend Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.4
- **Data Fetching**: TanStack React Query 5.17
- **Routing**: React Router 6.21
- **Icons**: Lucide React
- **Charts**: Recharts 2.15

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Process Manager**: PM2 (production)
- **Reverse Proxy**: Nginx (production)
- **Cloud Platform**: AWS (planned)
  - Region: EU-West-1 (closest to Nigeria)
  - Database: Aurora PostgreSQL Serverless
  - Storage: S3
  - Messaging: SQS/SNS
  - Vector Search: OpenSearch Serverless

---

## ✅ Current Implementation Status

### Backend (95% Complete)

#### ✅ Fully Implemented
1. **Core Infrastructure**
   - Express server with security middleware (Helmet, CORS)
   - Request logging and performance monitoring
   - Rate limiting
   - Error handling
   - Security hardening (XSS, CSRF, parameter pollution)

2. **Authentication & Authorization**
   - User registration and login
   - JWT access tokens (1 hour expiry)
   - Refresh tokens (30 days expiry)
   - Password reset with SMS codes
   - Role-based access control
   - Business ownership verification

3. **Business Management**
   - CRUD operations for businesses
   - Business statistics and analytics
   - Settings management
   - Multi-business support per user

4. **Product Management**
   - Complete CRUD operations
   - Stock management with low-stock alerts
   - Category management
   - Search and filtering
   - Bulk operations
   - Image upload support

5. **Order Management**
   - Order creation and processing
   - Order status tracking (pending → delivered)
   - Order items management
   - Customer order history
   - Order statistics and reporting

6. **Payment Integration**
   - Paystack initialization and verification
   - Flutterwave initialization and verification
   - Webhook handling for both providers
   - Transaction tracking
   - Mock mode for development

7. **WhatsApp Integration**
   - Message sending and receiving
   - Webhook verification
   - Template messages
   - Media handling
   - Message status tracking
   - Mock mode enabled

8. **AI Service**
   - OpenAI GPT-4 integration (active)
   - AWS Bedrock LLaMA integration (configured)
   - Business context awareness
   - Product recommendations
   - Order intent detection
   - Multi-language support
   - Conversation management
   - Mock AI mode for testing

9. **Analytics Service**
   - Dashboard overview metrics
   - Sales trends analysis
   - Customer insights
   - Product performance
   - AI usage statistics
   - Response time tracking

10. **Team Management**
    - Team member invitation
    - Role management (admin, manager, agent)
    - Permissions control

11. **Monitoring & Operations**
    - Request logging middleware
    - Performance monitoring
    - Health check endpoints
    - Metrics API endpoints

#### ⏳ Pending/Incomplete
- Redis integration (configured but not required for demo)
- AWS S3 file upload (using local storage for demo)
- Email notifications (optional for MVP)
- SMS notifications via AWS SNS (optional for MVP)

### Frontend (60% Complete)

#### ✅ Implemented
1. **Core Infrastructure**
   - React + TypeScript + Vite setup
   - Tailwind CSS configuration
   - React Query for data fetching
   - React Router for navigation
   - Authentication context and hooks
   - Protected routes
   - API client with interceptors

2. **Pages Created**
   - Login Page (fully functional)
   - Register Page (fully functional)
   - Dashboard Page (basic implementation)
   - Products Page (CRUD operations)
   - Orders Page (list and detail view)
   - Analytics Page (basic charts)
   - Settings Page (business configuration)
   - Team Page (team management)

3. **Components**
   - Layout with sidebar navigation
   - Error boundary
   - Loading states
   - Form components

#### ⏳ Needs Enhancement for Demo
1. **Dashboard Page**
   - Need to integrate with real analytics API
   - Add charts for trends
   - Add recent activity feed

2. **Products Page**
   - Already functional, may need UI polish
   - Add image preview

3. **Orders Page**
   - Add order status update functionality
   - Add order timeline
   - Add customer conversation history

4. **Analytics Page**
   - Need to add more charts (revenue trends, top products)
   - Customer insights visualization
   - AI usage statistics

5. **WhatsApp Demo Interface**
   - **CRITICAL**: Need to create a chat interface showing AI conversations
   - Mock conversation flow for demo
   - Show order creation from chat
   - Show payment link generation

### Database (100% Complete)

✅ **All Migrations Available**:
- 001: Initial schema (13 tables)
- 002: Auth tables (refresh_tokens, password_reset_tokens)
- 003-007: Additional features (not all run yet)

✅ **Seed Data Script**: Available at `backend/src/db/seed.js`
- Creates 3 test users
- Creates 3 test businesses (Fashion, Electronics, Food)
- Creates 15 products across businesses
- Creates sample orders and conversations

---

## 📁 Project Structure

```
WazAssist_App_CP/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.js          # JWT verification
│   │   │   │   ├── errorHandler.js             # Global error handling
│   │   │   │   └── rateLimiter.js              # Rate limiting
│   │   │   └── routes/
│   │   │       ├── admin.routes.js             # Admin operations
│   │   │       ├── analytics.routes.js         # Analytics endpoints
│   │   │       ├── auth.routes.js              # Authentication
│   │   │       ├── business.routes.js          # Business management
│   │   │       ├── monitoring.routes.js        # System monitoring
│   │   │       ├── order.routes.js             # Order management
│   │   │       ├── payment.routes.js           # Payment processing
│   │   │       ├── product.routes.js           # Product CRUD
│   │   │       ├── team.routes.js              # Team management
│   │   │       ├── upload.routes.js            # File uploads
│   │   │       └── webhook.routes.js           # WhatsApp/Payment webhooks
│   │   ├── config/
│   │   │   ├── database.js                     # PostgreSQL connection
│   │   │   ├── index.js                        # Centralized config
│   │   │   └── redis.js                        # Redis connection
│   │   ├── database/
│   │   │   └── migrations/                     # SQL migration files
│   │   ├── db/
│   │   │   ├── migrate.js                      # Migration runner
│   │   │   └── seed.js                         # Seed data script
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js              # Auth middleware
│   │   │   ├── requestLogger.middleware.js     # Request logging
│   │   │   ├── security.middleware.js          # Security hardening
│   │   │   └── upload.middleware.js            # File upload handling
│   │   ├── models/                             # Data models (minimal)
│   │   ├── services/
│   │   │   ├── ai.service.js                   # AI/LLM integration
│   │   │   ├── analytics.service.js            # Analytics logic
│   │   │   ├── auth.service.js                 # Authentication logic
│   │   │   ├── business.service.js             # Business operations
│   │   │   ├── message.service.js              # Message handling
│   │   │   ├── order.service.js                # Order processing
│   │   │   ├── payment.service.js              # Payment integration
│   │   │   ├── product.service.js              # Product operations
│   │   │   ├── team.service.js                 # Team management
│   │   │   ├── upload.service.js               # File upload to S3
│   │   │   └── whatsapp.service.js             # WhatsApp API
│   │   ├── utils/
│   │   │   └── logger.js                       # Winston logger
│   │   └── index.js                            # Main server entry
│   └── tests/                                   # Test scripts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.tsx               # Error boundary
│   │   │   └── Layout.tsx                      # Main layout
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx                     # Auth hook
│   │   │   └── useBusiness.tsx                 # Business context
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.tsx               # Analytics dashboard
│   │   │   ├── DashboardPage.tsx               # Main dashboard
│   │   │   ├── LoginPage.tsx                   # Login
│   │   │   ├── OrdersPage.tsx                  # Orders management
│   │   │   ├── ProductsPage.tsx                # Products CRUD
│   │   │   ├── RegisterPage.tsx                # Registration
│   │   │   ├── SettingsPage.tsx                # Settings
│   │   │   └── TeamPage.tsx                    # Team management
│   │   ├── services/
│   │   │   ├── api.ts                          # API client
│   │   │   ├── auth.ts                         # Auth service
│   │   │   ├── business.ts                     # Business service
│   │   │   ├── order.ts                        # Order service
│   │   │   └── product.ts                      # Product service
│   │   ├── App.tsx                             # Root component
│   │   ├── main.tsx                            # Entry point
│   │   └── index.css                           # Global styles
│   ├── index.html                              # HTML template
│   ├── package.json                            # Frontend dependencies
│   ├── tailwind.config.js                      # Tailwind config
│   ├── tsconfig.json                           # TypeScript config
│   └── vite.config.ts                          # Vite config
├── docs/
│   ├── architecture/                           # Architecture docs
│   ├── api/                                    # API documentation
│   └── guides/                                 # Setup guides
├── infrastructure/
│   ├── docker/                                 # Dockerfiles
│   └── terraform/                              # IaC for AWS
├── scripts/                                    # Utility scripts
├── data/                                       # Training & product data
├── .env                                        # Environment variables
├── .env.example                                # Environment template
├── docker-compose.dev.yml                      # Dev docker setup
├── docker-compose.prod.yml                     # Prod docker setup
├── Dockerfile                                  # Production dockerfile
├── ecosystem.config.js                         # PM2 config
├── package.json                                # Root dependencies
├── README.md                                   # Project overview
├── QUICK_START.md                              # Quick start guide
├── MVP_READINESS.md                            # MVP status
└── PRODUCTION_SETUP_GUIDE.md                   # Production guide
```

---

## 🗄️ Database Schema

### Core Tables (13 Tables)

1. **users** - User accounts
   - `id` (UUID, PK)
   - `name`, `phone_number`, `email`
   - `password_hash`
   - `is_active`, `created_at`, `updated_at`

2. **businesses** - Business profiles
   - `id` (UUID, PK)
   - `owner_id` (FK → users)
   - `business_name`, `description`, `business_type`
   - `phone_number`, `email`, `address`, `logo_url`
   - `whatsapp_phone_number_id`, `whatsapp_access_token`
   - `metadata` (JSONB), `is_active`

3. **products** - Product catalog
   - `id` (UUID, PK)
   - `business_id` (FK → businesses)
   - `name`, `description`, `price`, `currency`, `sku`, `category`
   - `quantity_in_stock`, `low_stock_threshold`
   - `primary_image_url`, `is_active`, `metadata` (JSONB)

4. **orders** - Customer orders
   - `id` (UUID, PK)
   - `business_id` (FK → businesses)
   - `customer_id`, `conversation_id` (FK → conversations)
   - `order_number`, `customer_phone`, `customer_name`
   - `subtotal`, `tax_amount`, `total_amount`, `currency`
   - `status` (pending, confirmed, processing, shipped, delivered, cancelled)
   - `payment_status` (pending, paid, failed, refunded)
   - `metadata` (JSONB)

5. **order_items** - Order line items
   - `id` (UUID, PK)
   - `order_id` (FK → orders)
   - `product_id` (FK → products)
   - `product_name`, `quantity`, `unit_price`, `total`

6. **conversations** - WhatsApp conversations
   - `id` (UUID, PK)
   - `business_id` (FK → businesses)
   - `customer_phone`, `customer_name`
   - `status` (active, resolved, archived)
   - `message_count`, `last_message_at`
   - `metadata` (JSONB)

7. **messages** - Individual messages
   - `id` (UUID, PK)
   - `conversation_id` (FK → conversations)
   - `whatsapp_message_id`, `direction` (inbound/outbound)
   - `message_type` (text, image, document, template)
   - `content`, `media_url`
   - `processed_by_ai`, `ai_intent`, `ai_confidence`

8. **payments** - Payment transactions
   - `id` (UUID, PK)
   - `order_id` (FK → orders)
   - `business_id` (FK → businesses)
   - `provider` (paystack/flutterwave)
   - `reference`, `amount`, `currency`
   - `status` (pending, success, failed)
   - `metadata` (JSONB)

9. **analytics_events** - Event tracking
   - `id` (UUID, PK)
   - `business_id` (FK → businesses)
   - `event_type`, `event_data` (JSONB)
   - `created_at`

10. **refresh_tokens** - JWT refresh tokens
    - `id` (UUID, PK)
    - `user_id` (FK → users)
    - `token`, `expires_at`, `is_revoked`

11. **password_reset_tokens** - Password reset codes
    - `id` (UUID, PK)
    - `user_id` (FK → users)
    - `reset_code`, `expires_at`, `is_used`

12. **team_members** - Business team members
    - `id` (UUID, PK)
    - `business_id` (FK → businesses)
    - `user_id` (FK → users)
    - `role` (admin, manager, agent)
    - `permissions` (JSONB)

13. **audit_logs** - Audit trail
    - `id` (UUID, PK)
    - `user_id`, `business_id`
    - `action`, `resource_type`, `resource_id`
    - `changes` (JSONB), `ip_address`

---

## 🔧 Backend Services

### 1. Authentication Service (`auth.service.js`)

**Functions**:
- `registerUser(userData)` - Create new user account
- `loginUser(phoneNumber, password)` - Authenticate user
- `verifyToken(token)` - Validate JWT token
- `refreshToken(refreshToken)` - Generate new access token
- `requestPasswordReset(phoneNumber)` - Send reset code via SMS
- `resetPassword(userId, resetCode, newPassword)` - Reset password
- `changePassword(userId, oldPassword, newPassword)` - Change password
- `logoutUser(userId)` - Revoke refresh tokens

**Key Features**:
- Bcrypt password hashing (10 rounds)
- JWT tokens with 1-hour expiry
- Refresh tokens with 30-day expiry
- 6-digit SMS reset codes
- Token revocation support

### 2. Business Service (`business.service.js`)

**Functions**:
- `createBusiness(businessData)` - Create new business
- `getBusinessById(businessId)` - Get business details
- `getBusinessesByOwner(ownerId)` - List user's businesses
- `updateBusiness(businessId, updates)` - Update business info
- `getBusinessStats(businessId)` - Get business statistics
- `searchBusinesses(query, filters)` - Search businesses

**Key Features**:
- Multi-business support per user
- Business settings management
- WhatsApp integration per business
- Business analytics

### 3. Product Service (`product.service.js`)

**Functions**:
- `createProduct(productData)` - Add new product
- `getProductById(productId, businessId)` - Get product details
- `getProductsByBusiness(businessId, filters)` - List products
- `updateProduct(productId, businessId, updates)` - Update product
- `deleteProduct(productId, businessId)` - Delete product
- `updateStock(productId, quantity)` - Adjust stock level
- `checkLowStock(businessId)` - Get low-stock products
- `searchProducts(businessId, query)` - Search products

**Key Features**:
- Stock management with alerts
- Category-based organization
- SKU support
- Price and currency management
- Image upload support
- Search and filtering

### 4. Order Service (`order.service.js`)

**Functions**:
- `createOrder(orderData)` - Create new order
- `getOrderById(orderId, businessId)` - Get order details
- `getOrdersByBusiness(businessId, filters)` - List orders
- `updateOrderStatus(orderId, status)` - Update order status
- `updatePaymentStatus(orderId, status)` - Update payment status
- `getCustomerOrders(customerId, businessId)` - Customer's orders
- `getOrderStats(businessId, dateRange)` - Order statistics

**Key Features**:
- Automatic order number generation
- Order items management
- Stock deduction on order creation
- Order status tracking
- Payment status tracking
- Order history

### 5. Payment Service (`payment.service.js`)

**Functions**:
- `initializePaystackPayment(orderData)` - Initialize Paystack payment
- `verifyPaystackPayment(reference)` - Verify Paystack transaction
- `initializeFlutterwavePayment(orderData)` - Initialize Flutterwave payment
- `verifyFlutterwavePayment(transactionId)` - Verify Flutterwave transaction
- `handlePaystackWebhook(payload, signature)` - Process Paystack webhook
- `handleFlutterwaveWebhook(payload, signature)` - Process Flutterwave webhook

**Key Features**:
- Dual payment provider support
- Webhook signature verification
- Transaction tracking
- Mock mode for development
- Amount conversion (Naira to kobo for Paystack)

### 6. WhatsApp Service (`whatsapp.service.js`)

**Functions**:
- `sendTextMessage(to, text, business)` - Send text message
- `sendTemplateMessage(to, templateName, components, business)` - Send template
- `sendImage(to, imageUrl, caption, business)` - Send image
- `sendDocument(to, documentUrl, filename, business)` - Send document
- `markMessageAsRead(messageId, business)` - Mark as read
- `verifyWebhook(mode, token, challenge)` - Verify webhook
- `processIncomingMessage(webhookData)` - Process incoming message

**Key Features**:
- Meta WhatsApp Cloud API integration
- Template message support
- Media handling
- Webhook verification
- Mock mode for development

### 7. AI Service (`ai.service.js`)

**Functions**:
- `generateResponse(prompt, options)` - Generate AI response
- `generateOpenAIResponse(prompt, options)` - OpenAI-specific generation
- `processWhatsAppMessage(message, business, conversation)` - Process customer message
- `detectOrderIntent(message, products)` - Detect order in message
- `extractOrderDetails(message, products)` - Extract order information
- `recommendProducts(query, products, limit)` - Product recommendations
- `translateMessage(message, targetLanguage)` - Translate to Nigerian languages

**Key Features**:
- OpenAI GPT-4 integration (active)
- AWS Bedrock LLaMA support
- Business context awareness
- Order intent detection
- Multi-language support (EN, Pidgin, Yoruba, Igbo, Hausa)
- Mock AI mode for testing
- Conversation management
- AI usage tracking

### 8. Analytics Service (`analytics.service.js`)

**Functions**:
- `getDashboardOverview(businessId, dateRange)` - Complete dashboard stats
- `getOrderMetrics(businessId, dateRange)` - Order statistics
- `getRevenueMetrics(businessId, dateRange)` - Revenue analysis
- `getCustomerMetrics(businessId, dateRange)` - Customer insights
- `getConversationMetrics(businessId, dateRange)` - Chat statistics
- `getProductMetrics(businessId)` - Product performance
- `getPaymentMetrics(businessId, dateRange)` - Payment analytics
- `getSalesTrends(businessId, period)` - Trend analysis
- `getTopSellingProducts(businessId, limit)` - Best sellers
- `getCustomerInsights(businessId)` - Customer behavior

**Key Features**:
- Real-time dashboard metrics
- Date range filtering
- Sales trends analysis
- Customer segmentation
- Product performance tracking
- AI usage statistics

### 9. Team Service (`team.service.js`)

**Functions**:
- `inviteTeamMember(businessId, memberData)` - Invite team member
- `getTeamMembers(businessId)` - List team members
- `updateMemberRole(memberId, role, permissions)` - Update role
- `removeMember(memberId, businessId)` - Remove team member

**Key Features**:
- Role-based access (admin, manager, agent)
- Custom permissions
- Invitation system

### 10. Upload Service (`upload.service.js`)

**Functions**:
- `uploadToS3(file, folder)` - Upload file to S3
- `generatePresignedUrl(key, expiresIn)` - Generate presigned URL
- `deleteFromS3(key)` - Delete file from S3

**Key Features**:
- AWS S3 integration
- Local file storage (development)
- Image optimization
- Presigned URLs for secure access

---

## 🎨 Frontend Application

### Authentication Flow

1. **Login** (`LoginPage.tsx`)
   - Phone number + password
   - JWT token stored in localStorage
   - Automatic redirect to dashboard
   - Token refresh on 401 errors

2. **Registration** (`RegisterPage.tsx`)
   - Name, phone, email, password
   - Automatic login after registration
   - Business creation optional

3. **Protected Routes**
   - All dashboard routes require authentication
   - Automatic redirect to login if not authenticated
   - Token validation on route change

### Page Descriptions

#### 1. Dashboard (`DashboardPage.tsx`)
- **Purpose**: Main landing page showing business overview
- **Features**:
  - Key metrics cards (products, orders, revenue, conversations)
  - Quick actions
  - Getting started guide
- **API Calls**:
  - `GET /api/v1/business/:businessId/stats`

#### 2. Products (`ProductsPage.tsx`)
- **Purpose**: Manage product inventory
- **Features**:
  - Product list with search
  - Add/edit/delete products
  - Stock management
  - Category filtering
- **API Calls**:
  - `GET /api/v1/business/:businessId/products`
  - `POST /api/v1/business/:businessId/products`
  - `PUT /api/v1/business/:businessId/products/:productId`
  - `DELETE /api/v1/business/:businessId/products/:productId`

#### 3. Orders (`OrdersPage.tsx`)
- **Purpose**: View and manage customer orders
- **Features**:
  - Order list with status filters
  - Order details view
  - Status update
  - Payment status tracking
- **API Calls**:
  - `GET /api/v1/business/:businessId/orders`
  - `GET /api/v1/orders/:orderId`
  - `PUT /api/v1/orders/:orderId/status`

#### 4. Analytics (`AnalyticsPage.tsx`)
- **Purpose**: Business intelligence and reporting
- **Features**:
  - Revenue trends chart
  - Top selling products
  - Customer insights
  - AI usage statistics
- **API Calls**:
  - `GET /api/v1/business/:businessId/analytics`
  - `GET /api/v1/business/:businessId/analytics/trends`

#### 5. Settings (`SettingsPage.tsx`)
- **Purpose**: Business configuration
- **Features**:
  - Business profile edit
  - WhatsApp integration setup
  - Payment provider configuration
  - Notification settings
- **API Calls**:
  - `GET /api/v1/business/:businessId`
  - `PUT /api/v1/business/:businessId`

#### 6. Team (`TeamPage.tsx`)
- **Purpose**: Manage team members
- **Features**:
  - Team member list
  - Invite new members
  - Role management
  - Remove members
- **API Calls**:
  - `GET /api/v1/business/:businessId/team`
  - `POST /api/v1/business/:businessId/team`
  - `PUT /api/v1/team/:memberId`
  - `DELETE /api/v1/team/:memberId`

---

## 🚀 Development Setup

### Prerequisites

- **Node.js**: 20.x or higher
- **Docker**: Desktop (for PostgreSQL)
- **Git**: For version control
- **Text Editor**: VS Code recommended

### Step-by-Step Setup

#### 1. Start PostgreSQL Database

```bash
# Start Docker PostgreSQL container
docker-compose -f docker-compose.dev.yml up -d postgres

# Verify it's running
docker ps
```

#### 2. Configure Environment

The `.env` file is already configured with:
- Database: PostgreSQL on localhost:5432
- Mock mode enabled for AI, WhatsApp, and Payments
- OpenAI API key (if you have one, otherwise mock mode)

#### 3. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### 4. Run Database Migrations

```bash
# Run migration script
npm run migrate

# Or manually run migrations
node backend/src/db/migrate.js run
```

#### 5. Seed Database with Demo Data

```bash
# Run seed script
npm run seed

# Or manually
node backend/src/db/seed.js
```

This creates:
- 3 test users (john@example.com, jane@example.com, mike@example.com)
- 3 businesses (Fashion Paradise, Tech Hub, Delicious Bites)
- 15 products across businesses
- Sample orders and conversations

#### 6. Start Development Servers

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

#### 7. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

#### 8. Login to Demo

Use one of the seeded accounts:
- **Phone**: +2348012345601
- **Password**: Test@1234

---

## 📡 API Endpoints

### Authentication Endpoints

```
POST   /api/v1/auth/register          # Register new user
POST   /api/v1/auth/login             # Login user
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/logout            # Logout user
GET    /api/v1/auth/profile           # Get user profile
POST   /api/v1/auth/password/forgot   # Request password reset
POST   /api/v1/auth/password/reset    # Reset password with code
PUT    /api/v1/auth/password/change   # Change password
```

### Business Endpoints

```
POST   /api/v1/business               # Create business
GET    /api/v1/business               # List user's businesses
GET    /api/v1/business/:id           # Get business details
PUT    /api/v1/business/:id           # Update business
DELETE /api/v1/business/:id           # Delete business
GET    /api/v1/business/:id/stats     # Get business statistics
```

### Product Endpoints

```
GET    /api/v1/business/:businessId/products              # List products
POST   /api/v1/business/:businessId/products              # Create product
GET    /api/v1/business/:businessId/products/:productId   # Get product
PUT    /api/v1/business/:businessId/products/:productId   # Update product
DELETE /api/v1/business/:businessId/products/:productId   # Delete product
GET    /api/v1/business/:businessId/products/low-stock    # Low stock alerts
POST   /api/v1/business/:businessId/products/search       # Search products
```

### Order Endpoints

```
GET    /api/v1/business/:businessId/orders       # List orders
POST   /api/v1/business/:businessId/orders       # Create order
GET    /api/v1/orders/:orderId                   # Get order details
PUT    /api/v1/orders/:orderId/status            # Update order status
PUT    /api/v1/orders/:orderId/payment           # Update payment status
GET    /api/v1/orders/customer/:customerId       # Customer orders
```

### Payment Endpoints

```
POST   /api/v1/payments/initialize               # Initialize payment
POST   /api/v1/payments/verify                   # Verify payment
POST   /api/v1/webhooks/paystack                 # Paystack webhook
POST   /api/v1/webhooks/flutterwave              # Flutterwave webhook
GET    /api/v1/payments/order/:orderId           # Get payment for order
```

### WhatsApp Endpoints

```
GET    /api/v1/webhooks/whatsapp                 # Verify webhook
POST   /api/v1/webhooks/whatsapp                 # Receive messages
POST   /api/v1/whatsapp/send                     # Send message
GET    /api/v1/business/:businessId/conversations # List conversations
GET    /api/v1/conversations/:conversationId      # Get conversation
```

### Analytics Endpoints

```
GET    /api/v1/business/:businessId/analytics            # Dashboard overview
GET    /api/v1/business/:businessId/analytics/trends     # Sales trends
GET    /api/v1/business/:businessId/analytics/customers  # Customer insights
GET    /api/v1/business/:businessId/analytics/products   # Product performance
```

### Team Endpoints

```
GET    /api/v1/business/:businessId/team         # List team members
POST   /api/v1/business/:businessId/team         # Invite member
PUT    /api/v1/team/:memberId                    # Update member role
DELETE /api/v1/team/:memberId                    # Remove member
```

### Monitoring Endpoints

```
GET    /health                                   # Health check
GET    /ready                                    # Readiness check
GET    /api/v1/monitoring/metrics                # Application metrics
GET    /api/v1/monitoring/logs                   # Recent logs
```

---

## 🎯 Key Features

### 1. Multi-Language AI Support

The AI service supports 5 Nigerian languages:
- **English**: Standard business communication
- **Nigerian Pidgin**: "How much dis dress dey cost?"
- **Yoruba**: "Elo ni aṣọ yi jẹ?"
- **Igbo**: "Ego ole ka uwe a na-eri?"
- **Hausa**: "Nawa ne farashin wannan riga?"

### 2. Smart Order Processing

AI can extract order details from natural language:
```
Customer: "I want to order 2 jollof rice and 1 chapman"
AI: Detects order intent, finds products, calculates total, creates order
```

### 3. Payment Integration

- Automatically generates payment links
- Sends via WhatsApp
- Tracks payment status
- Supports cards, bank transfer, USSD

### 4. Inventory Management

- Real-time stock tracking
- Low stock alerts
- Automatic stock deduction on orders
- Stock adjustment history

### 5. Business Analytics

- Revenue trends
- Top selling products
- Customer lifetime value
- Conversion rates
- AI performance metrics

---

## 🧪 Demo Mode & Testing

### Mock Services

The application has mock modes for development without external services:

1. **Mock AI** (`config.mockAi = true`)
   - Returns pre-defined responses
   - Simulates order detection
   - No OpenAI/Bedrock required

2. **Mock WhatsApp** (`config.mockWhatsapp = true`)
   - Logs messages instead of sending
   - Returns mock message IDs
   - No WhatsApp Business API required

3. **Mock Payments** (`config.mockPayments = true`)
   - Simulates payment initialization
   - Returns mock payment URLs
   - No Paystack/Flutterwave required

### Test Data

Seed script creates realistic Nigerian business scenarios:

**Fashion Paradise** (Lagos):
- Designer Dress - ₦25,000
- Leather Handbag - ₦18,000
- Sneakers - ₦15,000
- Sunglasses - ₦8,000 (Low stock - 3 units)

**Tech Hub Electronics** (Abuja):
- Smartphone - ₦250,000
- Laptop - ₦450,000
- Wireless Earbuds - ₦25,000
- Power Bank - ₦12,000 (Low stock - 4 units)

**Delicious Bites** (Port Harcourt):
- Jollof Rice Combo - ₦3,500
- Pepper Soup - ₦2,500
- Suya Platter - ₦4,000
- Pounded Yam & Egusi - ₦3,000

### Test Scripts

Located in project root:
- `test-auth.js` - Test authentication flow (11 tests)
- `test-products.js` - Test product CRUD operations
- `test-orders.js` - Test order creation and management
- `test-whatsapp-message.js` - Test WhatsApp message sending
- `test-whatsapp-orders.js` - Test WhatsApp order flow

Run tests:
```bash
node test-auth.js
node test-products.js
node test-orders.js
```

---

## 📦 Deployment

### Development (Docker Compose)

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production (Docker Compose)

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Production (Manual with PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Build frontend
cd frontend
npm run build
cd ..

# Start backend with PM2
pm2 start ecosystem.config.js

# Start Nginx (for serving frontend and reverse proxy)
sudo systemctl start nginx
```

### AWS Deployment

See `PRODUCTION_SETUP_GUIDE.md` for complete AWS deployment instructions including:
- Aurora PostgreSQL setup
- ElastiCache Redis
- S3 buckets
- API Gateway + Lambda
- ECS Fargate
- CloudFront CDN

---

## 💼 Business Model

### SaaS Pricing Tiers

1. **Starter** - ₦5,000/month
   - 1,000 messages/month
   - 1 business
   - Basic analytics
   - Email support

2. **Professional** - ₦15,000/month
   - 5,000 messages/month
   - 3 businesses
   - Advanced analytics
   - Team management (5 members)
   - Priority support

3. **Business** - ₦50,000/month
   - 20,000 messages/month
   - 10 businesses
   - Custom analytics
   - Team management (20 members)
   - Dedicated support
   - API access

4. **Enterprise** - ₦200,000+/month
   - Unlimited messages
   - Unlimited businesses
   - Custom features
   - White-label option
   - Dedicated account manager
   - SLA guarantee

### Target Market

- **Primary**: Nigerian SMEs (retail, food, fashion, electronics)
- **Size**: 1-50 employees
- **Revenue**: ₦50k-₦5M/month
- **Geography**: Lagos, Abuja, Port Harcourt (initially)

### Revenue Projections (Year 1)

- **Month 1-3**: 100 users → ₦500k MRR
- **Month 4-6**: 500 users → ₦2.5M MRR
- **Month 7-9**: 1,500 users → ₦7.5M MRR
- **Month 10-12**: 3,000 users → ₦15M MRR

**Total Year 1**: ₦180M revenue

---

## 🐛 Common Issues & Solutions

### Database Connection Issues

**Issue**: `connection refused` to PostgreSQL

**Solution**:
```bash
# Check if Docker is running
docker ps

# Start PostgreSQL container
docker-compose -f docker-compose.dev.yml up -d postgres

# Check logs
docker logs wazassist_postgres
```

### Port Already in Use

**Issue**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port in .env
PORT=3001
```

### Frontend Not Connecting to Backend

**Issue**: CORS errors or 404 on API calls

**Solution**:
- Check `VITE_API_URL` in frontend `.env` file
- Should be `http://localhost:3000` for development
- Ensure backend is running on port 3000

### Migration Errors

**Issue**: Migration fails with "relation already exists"

**Solution**:
```bash
# Check migration status
node backend/src/db/migrate.js list

# Reset database (CAUTION: deletes all data)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres

# Run migrations again
npm run migrate
```

### Seed Data Already Exists

**Issue**: Seed script fails due to duplicate data

**Solution**:
- Seed script uses `ON CONFLICT DO NOTHING`
- Safe to run multiple times
- Or manually delete data and re-seed

### Login Not Working

**Issue**: 401 Unauthorized on login

**Solution**:
- Check if user exists in database
- Verify password is correct (Test@1234 for seeded users)
- Check JWT_SECRET is set in `.env`
- Clear browser localStorage and try again

---

## 📚 Additional Resources

### Documentation Files

- `README.md` - Project overview
- `PROJECT_STATUS.md` - Implementation status (620 lines)
- `MVP_READINESS.md` - MVP assessment (468 lines)
- `QUICK_START.md` - Quick start guide (138 lines)
- `PRODUCTION_SETUP_GUIDE.md` - Production deployment (22KB)
- `OPERATIONS.md` - Operations guide (17KB)
- `SETUP_CHECKLIST.md` - Setup checklist (6.8KB)
- `DEVELOPMENT_GUIDE.md` - Development guide
- `USER_GUIDE.md` - User manual
- `DEPLOYMENT.md` - Deployment instructions

### Architecture Documentation

- `docs/architecture/01-system-overview.md` - System architecture
- `docs/architecture/02-aws-architecture.md` - AWS services
- `docs/architecture/03-database-design.md` - Database schema

### Test Credentials

**Seeded Users**:
1. John Doe - +2348012345601 / Test@1234
2. Jane Smith - +2348012345602 / Test@1234
3. Mike Johnson - +2348012345603 / Test@1234

---

## 🎬 Demo Preparation Checklist

### Before Demo

- [ ] Start Docker PostgreSQL
- [ ] Run all migrations
- [ ] Seed database with demo data
- [ ] Start backend server
- [ ] Start frontend server
- [ ] Test login with demo credentials
- [ ] Verify all pages load correctly
- [ ] Check analytics data is displaying
- [ ] Test product CRUD operations
- [ ] Test order creation
- [ ] Prepare WhatsApp conversation demo

### During Demo

1. **Show Dashboard** - Business overview
2. **Demo Products** - Add/edit inventory
3. **Show Orders** - Customer orders
4. **Demo WhatsApp** - AI conversation (mock or video)
5. **Show Analytics** - Charts and insights
6. **Show Payment** - Payment link generation

### Demo Script

See separate document for detailed demo script with:
- 3 business scenarios
- Sample conversations
- Key talking points
- Investor Q&A preparation

---

## 🚀 Next Steps for Production

1. **AWS Infrastructure Setup**
   - Aurora PostgreSQL database
   - ElastiCache Redis
   - S3 buckets for media
   - SQS/SNS for messaging

2. **External Service Integration**
   - OpenAI or AWS Bedrock API
   - WhatsApp Business API (Meta or 360Dialog)
   - Paystack live credentials
   - Flutterwave live credentials

3. **Security Hardening**
   - Enable SSL/TLS
   - Set up WAF (Web Application Firewall)
   - Configure AWS IAM roles
   - Enable CloudWatch monitoring
   - Set up AWS GuardDuty

4. **Monitoring & Observability**
   - CloudWatch metrics
   - X-Ray tracing
   - Error tracking (Sentry)
   - Uptime monitoring

5. **Marketing & Launch**
   - Landing page
   - Demo video
   - Customer onboarding flow
   - Support documentation
   - Pricing page

---

## 📞 Support & Contact

For technical questions or issues:
- Check documentation first
- Review common issues section
- Check GitHub issues (if applicable)
- Contact: support@wazassist.ai (when live)

---

**Last Updated**: February 14, 2026  
**Version**: 1.0  
**Status**: Production-Ready MVP (75% Complete)
