# WazAssist AI - Database Schema Documentation

Complete documentation of the PostgreSQL database schema for WazAssist AI.

## Table of Contents
- [Overview](#overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
  - [users](#users)
  - [businesses](#businesses)
  - [products](#products)
  - [orders](#orders)
  - [order_items](#order_items)
  - [conversations](#conversations)
  - [messages](#messages)
  - [payment_transactions](#payment_transactions)
  - [ai_prompts](#ai_prompts)
- [Indexes](#indexes)
- [Relationships](#relationships)
- [Data Types](#data-types)
- [Sample Queries](#sample-queries)

---

## Overview

**Database:** PostgreSQL 14+
**Schema:** Public
**Character Set:** UTF-8
**Timezone:** UTC

### Design Principles
- **UUID Primary Keys**: All tables use UUID for primary keys to enable distributed systems
- **Timestamps**: All tables have `created_at` and `updated_at` timestamps
- **Soft Deletes**: Important data uses `deleted_at` for soft deletion
- **JSONB Metadata**: Flexible metadata storage using JSONB for extensibility
- **Foreign Keys**: Enforced referential integrity with cascade rules
- **Indexes**: Strategic indexing for query performance

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│   users     │────────▶│  businesses  │
└─────────────┘         └──────────────┘
      │                       │
      │                       │
      │                       ▼
      │                 ┌──────────────┐
      │                 │   products   │
      │                 └──────────────┘
      │                       │
      │                       │
      ▼                       ▼
┌──────────────┐        ┌──────────────┐
│conversations │        │    orders    │
└──────────────┘        └──────────────┘
      │                       │
      │                       ▼
      ▼                 ┌──────────────┐
┌──────────────┐        │ order_items  │
│  messages    │        └──────────────┘
└──────────────┘               │
      │                       ▼
      │                 ┌──────────────────────┐
      │                 │ payment_transactions │
      │                 └──────────────────────┘
      │
      ▼
┌──────────────┐
│ ai_prompts   │
└──────────────┘
```

---

## Tables

### users

Stores customer and business owner information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  cognito_user_id VARCHAR(255) UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| name | VARCHAR(255) | NOT NULL | User's full name |
| email | VARCHAR(255) | UNIQUE | User's email address (optional) |
| phone_number | VARCHAR(20) | UNIQUE, NOT NULL | WhatsApp phone number (+234...) |
| role | VARCHAR(50) | DEFAULT 'customer' | User role: 'customer', 'business_owner', 'admin' |
| cognito_user_id | VARCHAR(255) | UNIQUE | AWS Cognito user ID for authentication |
| metadata | JSONB | DEFAULT '{}' | Additional user data (preferences, settings) |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Sample Data
```sql
INSERT INTO users (name, email, phone_number, role) VALUES
('John Doe', 'john@example.com', '+2348012345678', 'customer'),
('Jane Smith', 'jane@business.com', '+2348087654321', 'business_owner');
```

---

### businesses

Stores business profile information.

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique business identifier |
| owner_id | UUID | FK → users(id) | Business owner reference |
| business_name | VARCHAR(255) | NOT NULL | Business display name |
| description | TEXT | - | Business description |
| category | VARCHAR(100) | - | Business category (e.g., 'Fashion', 'Electronics') |
| phone_number | VARCHAR(20) | NOT NULL | Business WhatsApp number |
| email | VARCHAR(255) | - | Business email |
| address | TEXT | - | Physical address |
| logo_url | TEXT | - | S3 URL to business logo |
| settings | JSONB | DEFAULT '{}' | Business settings (AI behavior, notifications) |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Settings JSONB Structure
```json
{
  "ai_enabled": true,
  "auto_respond": true,
  "business_hours": {
    "monday": {"open": "09:00", "close": "17:00"},
    "tuesday": {"open": "09:00", "close": "17:00"}
  },
  "payment_providers": ["paystack", "flutterwave"],
  "currency": "NGN",
  "tax_rate": 7.5
}
```

---

### products

Stores product catalog for each business.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  sku VARCHAR(100),
  quantity_in_stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  images TEXT[],
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique product identifier |
| business_id | UUID | FK → businesses(id) | Business reference |
| name | VARCHAR(255) | NOT NULL | Product name |
| description | TEXT | - | Product description |
| price | DECIMAL(10,2) | NOT NULL | Product price in NGN |
| category | VARCHAR(100) | - | Product category |
| sku | VARCHAR(100) | - | Stock Keeping Unit |
| quantity_in_stock | INTEGER | DEFAULT 0 | Current stock quantity |
| low_stock_threshold | INTEGER | DEFAULT 10 | Alert threshold |
| images | TEXT[] | - | Array of S3 image URLs |
| metadata | JSONB | DEFAULT '{}' | Additional product data |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Metadata JSONB Structure
```json
{
  "brand": "Samsung",
  "model": "Galaxy S23",
  "specifications": {
    "color": "Black",
    "storage": "256GB",
    "warranty": "1 year"
  },
  "tags": ["electronics", "smartphone", "bestseller"]
}
```

---

### orders

Stores customer orders.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  shipping_address TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique order identifier |
| business_id | UUID | FK → businesses(id) | Business reference |
| customer_id | UUID | FK → users(id) | Customer reference |
| conversation_id | UUID | FK → conversations(id) | Associated conversation |
| order_number | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable order number |
| status | VARCHAR(50) | DEFAULT 'pending' | Order status |
| subtotal | DECIMAL(10,2) | NOT NULL | Sum of items before tax/fees |
| tax_amount | DECIMAL(10,2) | DEFAULT 0 | VAT/tax amount |
| shipping_fee | DECIMAL(10,2) | DEFAULT 0 | Delivery fee |
| discount_amount | DECIMAL(10,2) | DEFAULT 0 | Discount applied |
| total_amount | DECIMAL(10,2) | NOT NULL | Final amount to pay |
| payment_status | VARCHAR(50) | DEFAULT 'pending' | Payment status |
| payment_method | VARCHAR(50) | - | Payment method used |
| shipping_address | TEXT | - | Delivery address |
| notes | TEXT | - | Order notes/instructions |
| metadata | JSONB | DEFAULT '{}' | Additional order data |
| created_at | TIMESTAMP | DEFAULT NOW() | Order creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Status Values
- `pending`: Order created, awaiting confirmation
- `confirmed`: Order confirmed by business
- `processing`: Order being prepared
- `shipped`: Order dispatched for delivery
- `delivered`: Order delivered to customer
- `cancelled`: Order cancelled

#### Payment Status Values
- `pending`: Awaiting payment
- `paid`: Payment successful
- `failed`: Payment failed
- `refunded`: Payment refunded

---

### order_items

Stores individual items within orders.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique item identifier |
| order_id | UUID | FK → orders(id) | Order reference |
| product_id | UUID | FK → products(id) | Product reference |
| product_name | VARCHAR(255) | NOT NULL | Product name snapshot |
| quantity | INTEGER | NOT NULL | Quantity ordered |
| unit_price | DECIMAL(10,2) | NOT NULL | Price per unit (snapshot) |
| total | DECIMAL(10,2) | NOT NULL | Line total (quantity × unit_price) |
| metadata | JSONB | DEFAULT '{}' | Additional item data |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

---

### conversations

Stores WhatsApp conversations.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active',
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique conversation identifier |
| business_id | UUID | FK → businesses(id) | Business reference |
| customer_id | UUID | FK → users(id) | Customer reference |
| status | VARCHAR(50) | DEFAULT 'active' | Conversation status |
| last_message_at | TIMESTAMP | - | Timestamp of last message |
| message_count | INTEGER | DEFAULT 0 | Total message count |
| metadata | JSONB | DEFAULT '{}' | Additional conversation data |
| created_at | TIMESTAMP | DEFAULT NOW() | Conversation start timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Status Values
- `active`: Ongoing conversation
- `resolved`: Issue resolved
- `archived`: Conversation archived

---

### messages

Stores individual messages in conversations.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  whatsapp_message_id VARCHAR(255) UNIQUE,
  direction VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  processed_by_ai BOOLEAN DEFAULT false,
  ai_model_used VARCHAR(50),
  ai_tokens_used INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique message identifier |
| conversation_id | UUID | FK → conversations(id) | Conversation reference |
| whatsapp_message_id | VARCHAR(255) | UNIQUE | WhatsApp API message ID |
| direction | VARCHAR(20) | NOT NULL | Message direction |
| message_type | VARCHAR(50) | DEFAULT 'text' | Type of message |
| content | TEXT | - | Message text content |
| media_url | TEXT | - | URL to media file (if applicable) |
| processed_by_ai | BOOLEAN | DEFAULT false | Whether AI processed this |
| ai_model_used | VARCHAR(50) | - | AI model used (e.g., 'gpt-4') |
| ai_tokens_used | INTEGER | - | Token count for AI processing |
| metadata | JSONB | DEFAULT '{}' | Additional message data |
| created_at | TIMESTAMP | DEFAULT NOW() | Message timestamp |

#### Direction Values
- `inbound`: From customer to business
- `outbound`: From business to customer

#### Message Type Values
- `text`: Plain text message
- `image`: Image attachment
- `document`: Document attachment
- `audio`: Audio message
- `video`: Video attachment
- `location`: Location share
- `interactive`: Button/list message

---

### payment_transactions

Stores payment transaction records.

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  reference VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  authorization_url TEXT,
  access_code VARCHAR(255),
  transaction_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique transaction identifier |
| order_id | UUID | FK → orders(id) | Order reference |
| business_id | UUID | FK → businesses(id) | Business reference |
| provider | VARCHAR(50) | NOT NULL | Payment provider |
| reference | VARCHAR(255) | UNIQUE, NOT NULL | Provider transaction reference |
| amount | DECIMAL(10,2) | NOT NULL | Transaction amount |
| currency | VARCHAR(10) | DEFAULT 'NGN' | Currency code |
| status | VARCHAR(50) | DEFAULT 'pending' | Transaction status |
| payment_method | VARCHAR(50) | - | Payment method used |
| customer_email | VARCHAR(255) | - | Customer email |
| customer_phone | VARCHAR(20) | - | Customer phone |
| authorization_url | TEXT | - | Payment page URL |
| access_code | VARCHAR(255) | - | Payment access code |
| transaction_date | TIMESTAMP | - | Transaction date from provider |
| paid_at | TIMESTAMP | - | Payment completion timestamp |
| metadata | JSONB | DEFAULT '{}' | Provider-specific data |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Provider Values
- `paystack`: Paystack payment
- `flutterwave`: Flutterwave payment

#### Status Values
- `pending`: Payment initiated
- `processing`: Payment in progress
- `completed`: Payment successful
- `failed`: Payment failed
- `refunded`: Payment refunded

---

### ai_prompts

Stores AI prompt templates for different scenarios.

```sql
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  prompt_type VARCHAR(50) NOT NULL,
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique prompt identifier |
| business_id | UUID | FK → businesses(id) | Business reference (NULL = global) |
| name | VARCHAR(255) | NOT NULL | Prompt name |
| prompt_type | VARCHAR(50) | NOT NULL | Prompt category |
| prompt_template | TEXT | NOT NULL | Prompt text with variables |
| variables | JSONB | DEFAULT '[]' | Template variable names |
| is_active | BOOLEAN | DEFAULT true | Active status |
| usage_count | INTEGER | DEFAULT 0 | Times used |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Prompt Type Values
- `customer_inquiry`: General customer questions
- `product_info`: Product information requests
- `order_status`: Order status inquiries
- `complaint`: Customer complaints
- `greeting`: Welcome messages

---

## Indexes

### Performance Indexes

```sql
-- Users indexes
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Businesses indexes
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_businesses_is_active ON businesses(is_active);

-- Products indexes
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_sku ON products(sku);

-- Orders indexes
CREATE INDEX idx_orders_business_id ON orders(business_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Conversations indexes
CREATE INDEX idx_conversations_business_id ON conversations(business_id);
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_processed_by_ai ON messages(processed_by_ai);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Payment transactions indexes
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_business_id ON payment_transactions(business_id);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(provider);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(reference);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- AI prompts indexes
CREATE INDEX idx_ai_prompts_business_id ON ai_prompts(business_id);
CREATE INDEX idx_ai_prompts_prompt_type ON ai_prompts(prompt_type);
CREATE INDEX idx_ai_prompts_is_active ON ai_prompts(is_active);
```

---

## Relationships

### One-to-Many Relationships

1. **users → businesses**: One user can own multiple businesses
2. **businesses → products**: One business can have multiple products
3. **businesses → orders**: One business can have multiple orders
4. **users → orders**: One customer can have multiple orders
5. **orders → order_items**: One order can have multiple items
6. **businesses → conversations**: One business can have multiple conversations
7. **users → conversations**: One customer can have multiple conversations
8. **conversations → messages**: One conversation can have multiple messages
9. **orders → payment_transactions**: One order can have multiple payment attempts

### Foreign Key Constraints

```sql
-- CASCADE: Delete children when parent is deleted
-- RESTRICT: Prevent parent deletion if children exist
-- SET NULL: Set child foreign key to NULL when parent is deleted

ALTER TABLE businesses
  ADD CONSTRAINT fk_businesses_owner
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE products
  ADD CONSTRAINT fk_products_business
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_business
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_customer
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_product
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE payment_transactions
  ADD CONSTRAINT fk_payment_transactions_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
```

---

## Data Types

### Common Data Types Used

| Type | Usage | Examples |
|------|-------|----------|
| UUID | Primary keys | `gen_random_uuid()` |
| VARCHAR(n) | Short text | Names, emails |
| TEXT | Long text | Descriptions, addresses |
| DECIMAL(10,2) | Money values | Prices, amounts |
| INTEGER | Counts | Quantity, stock |
| BOOLEAN | Flags | is_active, processed_by_ai |
| TIMESTAMP WITH TIME ZONE | Timestamps | created_at, updated_at |
| JSONB | Flexible data | metadata, settings |
| TEXT[] | Array of strings | Product images |

### JSONB vs JSON
- **JSONB** is used throughout for better performance
- Supports indexing with GIN indexes
- Binary storage format
- Efficient for queries

---

## Sample Queries

### Get Business Dashboard Overview

```sql
SELECT
  b.business_name,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT o.customer_id) as total_customers,
  COUNT(DISTINCT p.id) as total_products,
  COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_status = 'paid'), 0) as total_revenue
FROM businesses b
LEFT JOIN orders o ON b.id = o.business_id
LEFT JOIN products p ON b.id = p.business_id
WHERE b.id = 'business-uuid'
GROUP BY b.id, b.business_name;
```

### Get Top Selling Products

```sql
SELECT
  p.id,
  p.name,
  p.category,
  p.price,
  SUM(oi.quantity) as total_sold,
  SUM(oi.total) as total_revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.business_id = 'business-uuid'
  AND o.payment_status = 'paid'
  AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.category, p.price
ORDER BY total_sold DESC
LIMIT 10;
```

### Get Customer Order History

```sql
SELECT
  o.order_number,
  o.created_at,
  o.status,
  o.payment_status,
  o.total_amount,
  COUNT(oi.id) as item_count
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.customer_id = 'customer-uuid'
GROUP BY o.id, o.order_number, o.created_at, o.status, o.payment_status, o.total_amount
ORDER BY o.created_at DESC;
```

### Get Conversation with Messages

```sql
SELECT
  c.id as conversation_id,
  c.status,
  c.created_at as conversation_start,
  json_agg(
    json_build_object(
      'id', m.id,
      'direction', m.direction,
      'content', m.content,
      'created_at', m.created_at
    ) ORDER BY m.created_at
  ) as messages
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.id = 'conversation-uuid'
GROUP BY c.id, c.status, c.created_at;
```

### Get Payment Statistics

```sql
SELECT
  provider,
  COUNT(*) as total_transactions,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_processed
FROM payment_transactions
WHERE business_id = 'business-uuid'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider;
```

### Search Products

```sql
SELECT
  id,
  name,
  description,
  price,
  category,
  quantity_in_stock
FROM products
WHERE business_id = 'business-uuid'
  AND is_active = true
  AND (
    name ILIKE '%search_term%'
    OR description ILIKE '%search_term%'
    OR category ILIKE '%search_term%'
  )
ORDER BY name;
```

### Get Low Stock Products

```sql
SELECT
  id,
  name,
  category,
  quantity_in_stock,
  low_stock_threshold
FROM products
WHERE business_id = 'business-uuid'
  AND is_active = true
  AND quantity_in_stock <= low_stock_threshold
ORDER BY quantity_in_stock ASC;
```

---

## Maintenance

### Backup

```bash
# Full database backup
pg_dump wazassist_production > backup_$(date +%Y%m%d).sql

# Specific tables
pg_dump -t orders -t order_items wazassist_production > orders_backup.sql
```

### Restore

```bash
# Restore full backup
psql wazassist_production < backup_20240120.sql

# Restore specific table
psql wazassist_production < orders_backup.sql
```

### Vacuum

```sql
-- Analyze and optimize
VACUUM ANALYZE;

-- Full vacuum (requires downtime)
VACUUM FULL;
```

### Statistics

```sql
-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

## Best Practices

### 1. Always Use Transactions for Multi-Table Operations

```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');

  // Insert order
  const order = await client.query('INSERT INTO orders ...');

  // Insert order items
  await client.query('INSERT INTO order_items ...');

  // Update product stock
  await client.query('UPDATE products ...');

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 2. Use Prepared Statements to Prevent SQL Injection

```javascript
// Good
await query('SELECT * FROM users WHERE id = $1', [userId]);

// Bad
await query(`SELECT * FROM users WHERE id = '${userId}'`);
```

### 3. Index Foreign Keys and Frequently Queried Columns

```sql
CREATE INDEX idx_orders_business_id ON orders(business_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

### 4. Use JSONB Indexes for Metadata Queries

```sql
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);

-- Query metadata
SELECT * FROM products
WHERE metadata @> '{"tags": ["electronics"]}';
```

---

For more information, refer to:
- [API Documentation](./API_DOCUMENTATION.md)
- [Developer Setup Guide](./DEVELOPER_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
