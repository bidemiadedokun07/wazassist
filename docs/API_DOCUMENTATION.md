# WazAssist AI - API Documentation

**Base URL**: `http://localhost:3000/api/v1` (Development)
**Base URL**: `https://api.wazassist.com/api/v1` (Production)

**Version**: 1.0.0
**Last Updated**: December 27, 2025

---

## Table of Contents
1. [Authentication](#authentication)
2. [Products API](#products-api)
3. [Orders API](#orders-api)
4. [Payments API](#payments-api)
5. [Analytics API](#analytics-api)
6. [Webhooks](#webhooks)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

**Coming Soon**: JWT-based authentication with AWS Cognito

Current development mode allows unauthenticated access. In production, all endpoints except webhooks will require:

```
Authorization: Bearer <your_jwt_token>
```

---

## Products API

### 1. Create Product
**POST** `/products`

Create a new product in the catalog.

**Request Body:**
```json
{
  "businessId": "uuid",
  "name": "Nike Air Max 270",
  "description": "Premium running shoes with air cushioning",
  "price": 42000,
  "currency": "NGN",
  "sku": "NIKE-AM270-BLK-42",
  "category": "footwear",
  "quantityInStock": 25,
  "lowStockThreshold": 5,
  "primaryImageUrl": "https://cdn.example.com/nike-am270.jpg",
  "metadata": {
    "brand": "Nike",
    "color": "Black",
    "size": "42"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessId": "uuid",
    "name": "Nike Air Max 270",
    "price": "42000.00",
    "quantityInStock": 25,
    "createdAt": "2025-12-27T10:00:00Z",
    ...
  },
  "message": "Product created successfully"
}
```

---

### 2. List Products
**GET** `/products/business/:businessId`

Get all products for a business with optional filtering.

**Query Parameters:**
- `category` (string): Filter by category
- `isActive` (boolean): Filter by active status
- `inStock` (boolean): Only show products in stock
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `sortBy` (string): Sort field (default: `created_at`)
- `sortOrder` (string): `ASC` or `DESC` (default: `DESC`)
- `limit` (number): Items per page (default: 50)
- `offset` (number): Pagination offset (default: 0)

**Example:**
```
GET /products/business/123/category/footwear?inStock=true&limit=10
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Nike Air Max 270",
      "price": "42000.00",
      "quantityInStock": 25,
      ...
    }
  ],
  "count": 1,
  "filters": { "inStock": true }
}
```

---

### 3. Get Single Product
**GET** `/products/:productId/business/:businessId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nike Air Max 270",
    ...
  }
}
```

---

### 4. Update Product
**PUT** `/products/:productId/business/:businessId`

**Request Body:** (Only include fields to update)
```json
{
  "price": 45000,
  "quantityInStock": 30,
  "description": "Updated description"
}
```

**Response:** `200 OK`

---

### 5. Delete Product
**DELETE** `/products/:productId/business/:businessId`

Soft deletes the product (sets `is_active` to false).

**Response:** `200 OK`

---

### 6. Update Stock
**PATCH** `/products/:productId/business/:businessId/stock`

Update product stock quantity.

**Request Body:**
```json
{
  "quantity": 10,
  "operation": "increment"  // "set", "increment", or "decrement"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quantityInStock": 35,
    "lowStockAlert": false
  }
}
```

---

### 7. Search Products
**GET** `/products/business/:businessId/search?q=nike`

Full-text search across product name, description, category, and SKU.

**Response:** `200 OK`

---

### 8. Get Products by Category
**GET** `/products/business/:businessId/category/:category`

**Response:** `200 OK`

---

### 9. Get Low Stock Products
**GET** `/products/business/:businessId/low-stock`

Returns products where `quantityInStock <= lowStockThreshold`.

**Response:** `200 OK`

---

### 10. List Categories
**GET** `/products/business/:businessId/categories`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": ["footwear", "accessories", "apparel"],
  "count": 3
}
```

---

### 11. Bulk Create Products
**POST** `/products/business/:businessId/bulk`

**Request Body:**
```json
{
  "products": [
    {
      "name": "Product 1",
      "price": 10000,
      ...
    },
    {
      "name": "Product 2",
      "price": 15000,
      ...
    }
  ]
}
```

**Response:** `201 Created`

---

## Orders API

### 1. Create Order
**POST** `/orders`

**Request Body:**
```json
{
  "businessId": "uuid",
  "customerId": "uuid",
  "customerPhone": "+2348012345678",
  "customerName": "John Doe",
  "deliveryAddress": "123 Main St, Lagos",
  "deliveryPhone": "+2348012345678",
  "paymentMethod": "cash",
  "items": [
    {
      "productId": "uuid",
      "productName": "Nike Air Max 270",
      "quantity": 2,
      "unitPrice": 42000
    }
  ],
  "notes": "Deliver before 5pm"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-MJOLMNSA-BVM5",
    "totalAmount": "84000.00",
    "status": "pending",
    "paymentStatus": "pending",
    "items": [...]
  }
}
```

---

### 2. List Orders
**GET** `/orders/business/:businessId`

**Query Parameters:**
- `status` (string): `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`
- `paymentStatus` (string): `pending`, `paid`, `failed`, `refunded`
- `customerId` (uuid): Filter by customer
- `startDate` (ISO 8601): Start date filter
- `endDate` (ISO 8601): End date filter
- `sortBy` (string): Sort field
- `sortOrder` (string): `ASC` or `DESC`
- `limit` (number): Items per page
- `offset` (number): Pagination offset

**Response:** `200 OK`

---

### 3. Get Single Order
**GET** `/orders/:orderId/business/:businessId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-XXX",
    "status": "confirmed",
    "items": [
      {
        "productName": "Nike Air Max 270",
        "quantity": 2,
        "unitPrice": "42000.00",
        "total": "84000.00"
      }
    ]
  }
}
```

---

### 4. Get Customer Orders
**GET** `/orders/customer/:customerId/business/:businessId`

**Response:** `200 OK`

---

### 5. Update Order Status
**PATCH** `/orders/:orderId/business/:businessId/status`

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Order confirmed by business"
}
```

**Valid Statuses:**
- `pending`
- `confirmed`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

**Response:** `200 OK`

---

### 6. Update Payment Status
**PATCH** `/orders/:orderId/business/:businessId/payment`

**Request Body:**
```json
{
  "paymentStatus": "paid",
  "paymentReference": "PAY-TEST-123456"
}
```

**Valid Payment Statuses:**
- `pending`
- `paid`
- `failed`
- `refunded`

**Response:** `200 OK`

---

### 7. Cancel Order
**POST** `/orders/:orderId/business/:businessId/cancel`

Cancels order and restores product stock.

**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response:** `200 OK`

---

### 8. Get Order Statistics
**GET** `/orders/business/:businessId/statistics`

**Query Parameters:**
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalOrders": "150",
    "pendingOrders": "12",
    "confirmedOrders": "45",
    "deliveredOrders": "85",
    "cancelledOrders": "8",
    "paidOrders": "120",
    "totalRevenue": "5500000.00",
    "paidRevenue": "5200000.00",
    "averageOrderValue": "36666.67"
  }
}
```

---

### 9. Get Recent Orders
**GET** `/orders/business/:businessId/recent?limit=10`

**Response:** `200 OK`

---

### 10. Search Orders
**GET** `/orders/business/:businessId/search?q=+2348012345678`

Search by customer phone, name, or order ID.

**Response:** `200 OK`

---

## Payments API

### 1. Initialize Paystack Payment
**POST** `/payments/paystack/initialize`

**Request Body:**
```json
{
  "orderId": "uuid",
  "businessId": "uuid",
  "email": "customer@example.com",
  "amount": 84000,
  "currency": "NGN"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "provider": "paystack",
    "reference": "PS-uuid-timestamp",
    "authorizationUrl": "https://checkout.paystack.com/xxx",
    "accessCode": "xxx"
  }
}
```

---

### 2. Initialize Flutterwave Payment
**POST** `/payments/flutterwave/initialize`

**Request Body:**
```json
{
  "orderId": "uuid",
  "businessId": "uuid",
  "email": "customer@example.com",
  "phoneNumber": "+2348012345678",
  "name": "John Doe",
  "amount": 84000,
  "currency": "NGN"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "provider": "flutterwave",
    "reference": "FW-uuid-timestamp",
    "paymentLink": "https://checkout.flutterwave.com/xxx"
  }
}
```

---

### 3. Verify Paystack Payment
**GET** `/payments/paystack/verify/:reference`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "success": true,
    "amount": 8400000,
    "currency": "NGN",
    "paidAt": "2025-12-27T10:30:00Z",
    "channel": "card"
  }
}
```

---

### 4. Verify Flutterwave Payment
**GET** `/payments/flutterwave/verify/:transactionId`

**Response:** `200 OK`

---

### 5. Paystack Webhook
**POST** `/payments/paystack/webhook`

Receives payment status updates from Paystack.

**Headers:**
- `x-paystack-signature`: Webhook signature

**Response:** `200 OK`

---

### 6. Flutterwave Webhook
**POST** `/payments/flutterwave/webhook`

**Headers:**
- `verif-hash`: Webhook signature

**Response:** `200 OK`

---

### 7. Get Order Payments
**GET** `/payments/order/:orderId/business/:businessId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "paystack",
      "reference": "PS-xxx",
      "amount": "84000.00",
      "status": "completed",
      "createdAt": "2025-12-27T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 8. Get Payment Statistics
**GET** `/payments/business/:businessId/statistics`

**Query Parameters:**
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "provider": "paystack",
      "totalTransactions": "120",
      "successfulTransactions": "115",
      "failedTransactions": "5",
      "pendingTransactions": "0",
      "totalAmount": "4500000.00",
      "averageAmount": "39130.43"
    }
  ]
}
```

---

## Analytics API

### 1. Get Dashboard Overview
**GET** `/analytics/business/:businessId/dashboard`

**Query Parameters:**
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "orders": {
      "totalOrders": "150",
      "pending": "12",
      "confirmed": "45",
      ...
    },
    "revenue": {
      "totalRevenue": "5500000.00",
      "paidRevenue": "5200000.00",
      ...
    },
    "customers": {
      "totalCustomers": 85,
      "newCustomers": 25,
      "returningCustomers": 60
    },
    "conversations": {
      "totalConversations": "200",
      "active": "45",
      "totalMessages": "1250",
      ...
    },
    "products": {
      "totalProducts": "50",
      "activeProducts": "48",
      "lowStockProducts": "5",
      "topSellingProducts": [...]
    },
    "payments": [...]
  }
}
```

---

### 2. Get Sales Trends
**GET** `/analytics/business/:businessId/sales-trends`

**Query Parameters:**
- `interval` (string): `hour`, `day`, `week`, `month` (default: `day`)
- `limit` (number): Number of periods (default: 30)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "period": "2025-12-27",
      "orderCount": "15",
      "totalRevenue": "420000.00",
      "avgOrderValue": "28000.00",
      "uniqueCustomers": "12"
    },
    ...
  ],
  "interval": "day",
  "count": 30
}
```

---

### 3. Get Customer Insights
**GET** `/analytics/business/:businessId/customers?limit=10`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "topCustomers": [
      {
        "id": "uuid",
        "name": "John Doe",
        "phoneNumber": "+2348012345678",
        "orderCount": "25",
        "totalSpent": "1200000.00",
        "avgOrderValue": "48000.00",
        "lastOrderDate": "2025-12-27T10:00:00Z"
      },
      ...
    ],
    "customerSegments": [
      {
        "customerType": "loyal",
        "count": "35",
        "avgLifetimeValue": "750000.00"
      },
      {
        "customerType": "occasional",
        "count": "42",
        "avgLifetimeValue": "180000.00"
      },
      {
        "customerType": "oneTime",
        "count": "8",
        "avgLifetimeValue": "55000.00"
      }
    ]
  }
}
```

---

### 4. Get Product Performance
**GET** `/analytics/business/:businessId/products?limit=20`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Nike Air Max 270",
      "category": "footwear",
      "price": "42000.00",
      "quantityInStock": "22",
      "totalSold": "125",
      "totalRevenue": "5250000.00",
      "uniqueBuyers": "95",
      "avgQuantityPerOrder": "1.32"
    },
    ...
  ],
  "count": 20
}
```

---

### 5. Get Response Times
**GET** `/analytics/business/:businessId/response-times`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalResponses": "450",
    "avgResponseTimeMinutes": "2.5",
    "medianResponseTimeMinutes": "1.8",
    "within1Minute": "280",
    "within5Minutes": "420",
    "within1Hour": "448"
  }
}
```

---

### 6. Get AI Usage Statistics
**GET** `/analytics/business/:businessId/ai-usage`

**Query Parameters:**
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "aiProcessedMessages": "850",
    "totalMessages": "1250",
    "totalTokensUsed": "125000",
    "avgTokensPerMessage": "147",
    "modelsUsed": "2"
  }
}
```

---

### 7. Get Category Performance
**GET** `/analytics/business/:businessId/categories`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "category": "footwear",
      "productCount": "25",
      "totalUnitsSold": "450",
      "totalRevenue": "18500000.00",
      "avgPrice": "41111.11"
    },
    ...
  ],
  "count": 5
}
```

---

## Webhooks

### WhatsApp Webhook
**POST** `/webhooks/whatsapp`

Receives messages from WhatsApp Cloud API.

**Headers:**
- `x-hub-signature-256`: Webhook signature (for verification)

**Request Body:** (WhatsApp message format)

**Response:** `200 OK`

---

### WhatsApp Verification
**GET** `/webhooks/whatsapp`

Used by Meta to verify the webhook endpoint.

**Query Parameters:**
- `hub.mode`
- `hub.challenge`
- `hub.verify_token`

**Response:** Returns `hub.challenge` if verification succeeds.

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error category",
  "message": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

**Current Limits:**
- 100 requests per minute per IP
- 1000 requests per minute for WhatsApp webhooks

**Headers:**
- `X-RateLimit-Limit`: Requests allowed per window
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## Testing

**Test Credentials:**
- Business ID: `c2c75837-2976-4013-a55f-114c0ecbc38e`
- Customer ID: `42d7e5a7-c610-4bf4-9bcc-12ef98c34f2b`

**Test Scripts:**
```bash
# Test products API
node test-products.js

# Test orders API
node test-orders.js

# Test WhatsApp integration
node test-whatsapp-orders.js
```

---

**Need Help?**
Contact: support@wazassist.com
Documentation: https://docs.wazassist.com
