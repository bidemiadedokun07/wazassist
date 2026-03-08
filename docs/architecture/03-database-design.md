# Database Design - WazAssist AI

## Database Technology

**Primary**: Amazon Aurora PostgreSQL 15.4 Serverless v2
**Cache**: Amazon ElastiCache Redis 7.0
**Vector Store**: Amazon OpenSearch Serverless

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   users     │──┬───<│  businesses  │>──┬───│  products   │
└─────────────┘  │    └──────────────┘   │   └─────────────┘
                 │                       │
                 │    ┌──────────────┐   │   ┌─────────────┐
                 └───<│conversations │   └──<│   orders    │
                      └──────────────┘       └─────────────┘
                             │                      │
                             v                      v
                      ┌──────────────┐       ┌─────────────┐
                      │   messages   │       │ order_items │
                      └──────────────┘       └─────────────┘
                                                    │
                      ┌──────────────┐              │
                      │   invoices   │<─────────────┘
                      └──────────────┘
                             │
                             v
                      ┌──────────────┐
                      │   payments   │
                      └──────────────┘
```

## Schema Definition

### Core Tables

#### 1. users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    whatsapp_id VARCHAR(50) UNIQUE,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    profile_picture_url TEXT,
    language_preference VARCHAR(10) DEFAULT 'en',
    -- en, pidgin, yoruba, igbo, hausa
    timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_whatsapp ON users(whatsapp_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(last_active_at) WHERE is_active = TRUE;
```

#### 2. businesses
```sql
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(50),
    -- retail, wholesale, service, restaurant, etc.
    description TEXT,
    logo_url TEXT,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(3) DEFAULT 'NGA',

    -- Business settings
    currency VARCHAR(3) DEFAULT 'NGN',
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    business_hours JSONB,
    -- {"monday": {"open": "09:00", "close": "18:00"}, ...}

    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'starter',
    -- starter, growth, pro, enterprise
    subscription_status VARCHAR(20) DEFAULT 'active',
    -- active, suspended, cancelled
    subscription_start_date DATE,
    subscription_end_date DATE,
    monthly_message_limit INT DEFAULT 500,
    monthly_message_count INT DEFAULT 0,

    -- WhatsApp Business API
    whatsapp_business_account_id VARCHAR(50),
    whatsapp_phone_number_id VARCHAR(50),
    whatsapp_access_token TEXT,
    whatsapp_webhook_verify_token VARCHAR(100),

    -- Payment integration
    paystack_public_key VARCHAR(100),
    paystack_secret_key_encrypted TEXT,
    flutterwave_public_key VARCHAR(100),
    flutterwave_secret_key_encrypted TEXT,

    -- AI settings
    ai_enabled BOOLEAN DEFAULT TRUE,
    ai_personality VARCHAR(50) DEFAULT 'friendly',
    -- friendly, professional, casual
    ai_language_mix BOOLEAN DEFAULT TRUE,
    -- Allow code-mixing (e.g., Pidgin + English)
    auto_response_delay_ms INT DEFAULT 2000,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_subscription ON businesses(subscription_status, subscription_tier);
CREATE INDEX idx_businesses_active ON businesses(is_active);
```

#### 3. products
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    sku VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(12,2) NOT NULL,
    compare_at_price DECIMAL(12,2),
    -- Original price for discount display
    cost DECIMAL(12,2),
    -- Cost basis for profit calculation
    currency VARCHAR(3) DEFAULT 'NGN',

    -- Inventory
    track_inventory BOOLEAN DEFAULT TRUE,
    quantity_in_stock INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,

    -- Product variants
    has_variants BOOLEAN DEFAULT FALSE,
    variants JSONB,
    -- [{"size": "M", "color": "Red", "sku": "...", "quantity": 5}, ...]

    -- Media
    images TEXT[],
    -- Array of S3 URLs
    primary_image_url TEXT,

    -- AI/RAG
    embedding_vector VECTOR(1536),
    -- For semantic search in OpenSearch
    tags TEXT[],
    search_keywords TEXT[],

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_products_sku ON products(business_id, sku);
CREATE INDEX idx_products_category ON products(business_id, category);
CREATE INDEX idx_products_active ON products(is_active, is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(quantity_in_stock) WHERE track_inventory = TRUE;

-- Full-text search
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english',
    coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || array_to_string(tags, ' ')
));
```

#### 4. conversations
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    whatsapp_conversation_id VARCHAR(100),

    -- Conversation state
    status VARCHAR(20) DEFAULT 'active',
    -- active, resolved, archived
    intent VARCHAR(50),
    -- inquiry, order, complaint, support, etc.
    sentiment VARCHAR(20),
    -- positive, neutral, negative

    -- AI context
    context_summary TEXT,
    -- Summary of conversation for AI context
    language_detected VARCHAR(10) DEFAULT 'en',
    entities_extracted JSONB,
    -- {"product_ids": [...], "order_id": "...", "intent": "..."}

    -- Session management
    session_start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end_time TIMESTAMP WITH TIME ZONE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_count INT DEFAULT 0,

    -- Assignment
    assigned_to_human BOOLEAN DEFAULT FALSE,
    assigned_to_user_id UUID REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_conversations_business ON conversations(business_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status, last_message_at);
CREATE INDEX idx_conversations_intent ON conversations(intent);
```

#### 5. messages
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    whatsapp_message_id VARCHAR(100) UNIQUE,

    -- Message direction
    direction VARCHAR(10) NOT NULL,
    -- inbound, outbound

    -- Sender/Receiver
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_phone VARCHAR(20),
    sender_name VARCHAR(100),

    -- Content
    message_type VARCHAR(20) DEFAULT 'text',
    -- text, image, audio, video, document, location, contact
    content TEXT,
    -- Text content or caption
    media_url TEXT,
    -- S3 URL for media
    media_mime_type VARCHAR(50),
    media_size_bytes BIGINT,

    -- AI processing
    processed_by_ai BOOLEAN DEFAULT FALSE,
    ai_model_used VARCHAR(50),
    -- llama3-1-8b, llama3-1-70b
    ai_tokens_used INT,
    ai_processing_time_ms INT,
    ai_confidence_score DECIMAL(3,2),

    -- Message status
    status VARCHAR(20) DEFAULT 'sent',
    -- sent, delivered, read, failed
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Error handling
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INT DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_whatsapp ON messages(whatsapp_message_id);
CREATE INDEX idx_messages_direction ON messages(direction, created_at DESC);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_ai ON messages(processed_by_ai, ai_model_used);
```

#### 6. orders
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

    -- Order identification
    order_number VARCHAR(50) UNIQUE NOT NULL,
    -- Format: ORD-20251224-0001

    -- Financial
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    shipping_fee DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',

    -- Customer info
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),

    -- Delivery
    delivery_method VARCHAR(20) DEFAULT 'delivery',
    -- delivery, pickup
    delivery_address TEXT,
    delivery_city VARCHAR(100),
    delivery_state VARCHAR(100),
    delivery_instructions TEXT,
    estimated_delivery_date DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, confirmed, processing, shipped, delivered, cancelled
    payment_status VARCHAR(20) DEFAULT 'pending',
    -- pending, partial, paid, refunded
    fulfillment_status VARCHAR(20) DEFAULT 'unfulfilled',
    -- unfulfilled, partial, fulfilled

    -- Timestamps
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,

    -- Notes
    customer_notes TEXT,
    internal_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_orders_business ON orders(business_id, created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status, payment_status);
CREATE INDEX idx_orders_date ON orders(created_at DESC);
```

#### 7. order_items
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Product snapshot (in case product is deleted/modified)
    product_name VARCHAR(200) NOT NULL,
    product_sku VARCHAR(50),
    variant_name VARCHAR(100),
    -- e.g., "Size M, Color Red"

    -- Pricing
    unit_price DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,

    -- Fulfillment
    fulfillment_status VARCHAR(20) DEFAULT 'unfulfilled',
    -- unfulfilled, fulfilled

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

#### 8. invoices
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Invoice identification
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    -- Format: INV-20251224-0001

    -- Financial
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    amount_due DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',

    -- Status
    status VARCHAR(20) DEFAULT 'draft',
    -- draft, sent, viewed, paid, overdue, cancelled

    -- Dates
    issue_date DATE NOT NULL,
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Files
    pdf_url TEXT,
    -- S3 URL
    pdf_generated_at TIMESTAMP WITH TIME ZONE,

    -- Delivery
    sent_to_customer BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,

    -- Notes
    notes TEXT,
    terms TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_invoices_business ON invoices(business_id, created_at DESC);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status NOT IN ('paid', 'cancelled');
```

#### 9. payments
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Payment identification
    payment_reference VARCHAR(100) UNIQUE NOT NULL,

    -- Financial
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',

    -- Payment gateway
    gateway VARCHAR(20) NOT NULL,
    -- paystack, flutterwave, manual
    gateway_reference VARCHAR(100),
    gateway_response JSONB,

    -- Payment method
    payment_method VARCHAR(30),
    -- card, bank_transfer, ussd, mobile_money, cash

    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, processing, successful, failed, refunded

    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,

    -- Error handling
    error_code VARCHAR(50),
    error_message TEXT,

    -- Refunds
    is_refund BOOLEAN DEFAULT FALSE,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_payments_business ON payments(business_id, created_at DESC);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_reference ON payments(payment_reference);
CREATE INDEX idx_payments_gateway ON payments(gateway, gateway_reference);
CREATE INDEX idx_payments_status ON payments(status);
```

### Analytics & Reporting Tables

#### 10. daily_analytics
```sql
CREATE TABLE daily_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Message metrics
    total_messages INT DEFAULT 0,
    inbound_messages INT DEFAULT 0,
    outbound_messages INT DEFAULT 0,
    ai_processed_messages INT DEFAULT 0,
    avg_response_time_seconds DECIMAL(8,2),

    -- Conversation metrics
    new_conversations INT DEFAULT 0,
    active_conversations INT DEFAULT 0,
    resolved_conversations INT DEFAULT 0,

    -- Customer metrics
    new_customers INT DEFAULT 0,
    active_customers INT DEFAULT 0,

    -- Order metrics
    orders_created INT DEFAULT 0,
    orders_confirmed INT DEFAULT 0,
    orders_completed INT DEFAULT 0,
    orders_cancelled INT DEFAULT 0,

    -- Financial metrics
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    total_refunds DECIMAL(12,2) DEFAULT 0.00,
    avg_order_value DECIMAL(12,2),

    -- AI metrics
    ai_tokens_used INT DEFAULT 0,
    ai_cost DECIMAL(8,2) DEFAULT 0.00,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_business_date UNIQUE(business_id, date)
);

CREATE INDEX idx_daily_analytics_business_date ON daily_analytics(business_id, date DESC);
```

#### 11. product_analytics
```sql
CREATE TABLE product_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Product metrics
    views INT DEFAULT 0,
    inquiries INT DEFAULT 0,
    orders INT DEFAULT 0,
    units_sold INT DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0.00,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_business_product_date UNIQUE(business_id, product_id, date)
);

CREATE INDEX idx_product_analytics_business_date ON product_analytics(business_id, date DESC);
CREATE INDEX idx_product_analytics_product ON product_analytics(product_id, date DESC);
```

### System Tables

#### 12. audit_logs
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Action details
    action VARCHAR(50) NOT NULL,
    -- user_login, order_created, payment_received, etc.
    entity_type VARCHAR(50),
    -- user, order, product, etc.
    entity_id UUID,

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Changes
    old_values JSONB,
    new_values JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_business ON audit_logs(business_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

#### 13. system_events
```sql
CREATE TABLE system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    -- webhook_received, ai_request, payment_webhook, etc.
    event_source VARCHAR(50),
    -- whatsapp, paystack, flutterwave, bedrock

    -- Payload
    payload JSONB,

    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INT,

    -- Error handling
    error BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    retry_count INT DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_events_type ON system_events(event_type, created_at DESC);
CREATE INDEX idx_system_events_processed ON system_events(processed, created_at) WHERE processed = FALSE;
CREATE INDEX idx_system_events_error ON system_events(error, retry_count) WHERE error = TRUE;
```

## Database Functions & Triggers

### Auto-update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to all relevant tables)
```

### Generate order numbers
```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
        LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE SEQUENCE order_number_seq;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();
```

### Calculate order totals
```sql
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount = NEW.subtotal + NEW.tax_amount + NEW.shipping_fee - NEW.discount_amount;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_order_total_trigger BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION calculate_order_total();
```

### Update inventory on order
```sql
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fulfillment_status = 'fulfilled' AND OLD.fulfillment_status != 'fulfilled' THEN
        UPDATE products
        SET quantity_in_stock = quantity_in_stock - NEW.quantity
        WHERE id = NEW.product_id AND track_inventory = TRUE;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_trigger AFTER UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_inventory_on_order();
```

## Data Retention Policy

| Table | Retention Period | Archive Strategy |
|-------|-----------------|------------------|
| messages | 90 days | Move to S3 Glacier |
| conversations | 1 year | Archive inactive |
| orders | Indefinite | Keep all |
| payments | Indefinite | Keep all |
| invoices | Indefinite | Keep all |
| audit_logs | 1 year | Move to S3 |
| system_events | 30 days | Delete |
| daily_analytics | Indefinite | Keep all |

## Backup Strategy

- **Automated Snapshots**: Daily (Aurora)
- **Retention**: 7 days
- **Cross-Region Replication**: Critical data only (Production)
- **Point-in-Time Recovery**: 5-minute RPO

## Redis Cache Schema

### Session Data
```
Key: session:{user_id}
Value: {conversation_context, last_message_time, language}
TTL: 1 hour
```

### Rate Limiting
```
Key: rate_limit:{business_id}:{minute}
Value: message_count
TTL: 1 minute
```

### Product Catalog Cache
```
Key: products:{business_id}
Value: JSON array of products
TTL: 6 hours
```

### Conversation Context
```
Key: conversation:{conversation_id}
Value: {message_history, entities, intent}
TTL: 1 hour
```

## OpenSearch Vector Store

### Products Index
```json
{
  "settings": {
    "index": {
      "knn": true
    }
  },
  "mappings": {
    "properties": {
      "product_id": {"type": "keyword"},
      "business_id": {"type": "keyword"},
      "name": {"type": "text"},
      "description": {"type": "text"},
      "category": {"type": "keyword"},
      "price": {"type": "float"},
      "embedding": {
        "type": "knn_vector",
        "dimension": 1536,
        "method": {
          "name": "hnsw",
          "engine": "faiss"
        }
      }
    }
  }
}
```

## Performance Optimization

### Query Optimization
- Appropriate indexes on all foreign keys
- Composite indexes for common query patterns
- Partial indexes for filtered queries
- Full-text search indexes

### Connection Pooling
- Min connections: 5
- Max connections: 100
- Idle timeout: 30 seconds

### Read Replicas
- Production: 1-2 read replicas
- Route analytics queries to replicas
- Asynchronous replication (lag < 1s)

---

**Next**: [LLM Pipeline](04-llm-pipeline.md)
