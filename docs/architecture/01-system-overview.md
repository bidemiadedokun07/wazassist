# System Overview - WazAssist AI

## Executive Summary

WazAssist AI is a cloud-native, AI-powered WhatsApp Business Assistant designed specifically for Nigerian SMEs. The system leverages AWS serverless and containerized services to provide scalable, cost-effective customer interaction automation.

## Business Problem

Nigerian SMEs face challenges:
- Limited customer service hours
- Language barriers (need for Pidgin, Yoruba, Igbo, Hausa)
- Manual order processing
- Poor inventory tracking
- Missed sales opportunities
- High operational costs

## Solution

An AI-powered WhatsApp bot that:
- Operates 24/7 with instant responses
- Understands and responds in 5 Nigerian languages
- Automates order processing and invoicing
- Integrates with Nigerian payment providers
- Provides actionable business analytics
- Scales automatically with demand

## Core Use Cases

### 1. Customer Interaction
```
Customer: "Wetin be the price for that shoe?"
AI: "The Nike Air Max na ₦45,000. We get am for black, white, and red. You wan order?"
```

### 2. Order Processing
```
Customer: "I wan buy 2 black ones, size 42"
AI: *Creates order, sends invoice*
"Your order don ready! Total na ₦90,000. I don send invoice. Pay with Paystack or Flutterwave."
```

### 3. Order Tracking
```
Customer: "Where my order dey?"
AI: "Your order #1234 don reach Lagos warehouse. E go deliver tomorrow before 3pm."
```

### 4. Product Recommendations
```
Customer: "I need running shoes"
AI (using RAG): "Based on your budget, I recommend:
1. Nike Revolution - ₦35,000
2. Adidas RunFalcon - ₦42,000
3. Puma Velocity - ₦38,000
Which one you like?"
```

## System Architecture Layers

### Layer 1: Client Layer
- WhatsApp users (customers)
- Web dashboard users (business owners)
- Mobile apps (future)

### Layer 2: API Gateway & Load Balancing
- Amazon API Gateway (REST & WebSocket)
- Application Load Balancer (ALB)
- AWS WAF (security)
- CloudFront (CDN)

### Layer 3: Application Layer
- **WhatsApp Integration Service**: Webhook handler, message router
- **AI Engine Service**: LLM orchestration, prompt management
- **Business Logic Service**: Orders, inventory, invoicing
- **Analytics Service**: Metrics, reports, insights
- **Notification Service**: Reminders, alerts

### Layer 4: AI/ML Layer
- **Amazon Bedrock**: LLaMA 3.1 inference
- **Amazon SageMaker**: Fine-tuning pipeline
- **Amazon OpenSearch**: Vector embeddings, RAG
- **LangChain**: Agent orchestration

### Layer 5: Data Layer
- **Aurora PostgreSQL**: Transactional data
- **Amazon S3**: Files, media, training data
- **ElastiCache Redis**: Session cache, rate limiting
- **DynamoDB**: High-speed lookups (optional)

### Layer 6: Integration Layer
- **Payment Gateways**: Paystack, Flutterwave
- **SMS Gateway**: Termii (backup notifications)
- **Email Service**: Amazon SES
- **WhatsApp API**: Meta Cloud API / 360Dialog

### Layer 7: Infrastructure Layer
- **Compute**: ECS Fargate, Lambda
- **Networking**: VPC, subnets, NAT gateways
- **Security**: IAM, KMS, Secrets Manager
- **Monitoring**: CloudWatch, X-Ray
- **Event Bus**: EventBridge, SQS, SNS

## Data Flow

### Incoming Message Flow
```
1. WhatsApp user sends message
2. Meta WhatsApp API receives message
3. Webhook POST to API Gateway
4. Lambda/ECS validates webhook
5. Message queued in SQS
6. Message processor retrieves from queue
7. AI service processes with Bedrock
8. RAG retrieves product context from OpenSearch
9. Response generated
10. Message sent back via WhatsApp API
11. Conversation logged to Aurora
12. Analytics updated
```

### Order Processing Flow
```
1. AI extracts order intent
2. Validates product availability
3. Creates order record in Aurora
4. Generates invoice PDF (stored in S3)
5. Sends invoice via WhatsApp
6. Creates payment link (Paystack/Flutterwave)
7. Waits for payment webhook
8. Confirms order on payment success
9. Triggers fulfillment workflow
10. Sends tracking updates
```

## Scalability Strategy

### Horizontal Scaling
- ECS Fargate auto-scaling (target CPU 70%)
- Lambda concurrent executions (1000+)
- Aurora read replicas (on demand)
- SQS queue for message buffering

### Vertical Scaling
- Aurora ACU auto-scaling (0.5 → 16 ACU)
- ElastiCache node size increase
- ECS task size adjustment

### Caching Strategy
- Redis for session data (TTL: 1 hour)
- CloudFront for static assets (TTL: 24 hours)
- Application-level caching for product catalog
- Bedrock response caching for common queries

## Availability & Reliability

### Target SLA
- Uptime: 99.9% (43 minutes downtime/month)
- Response Time: <2 seconds (p95)
- Error Rate: <0.1%

### High Availability Design
- Multi-AZ Aurora deployment
- ECS tasks across 2+ AZs
- S3 cross-region replication (critical data)
- Health checks on all services
- Automatic failover

### Disaster Recovery
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 5 minutes
- Automated backups (Aurora snapshots daily)
- Point-in-time recovery (7 days)
- Infrastructure as Code (Terraform) for rapid rebuild

## Security Architecture

### Defense in Depth
1. **Perimeter**: WAF, Shield, DDoS protection
2. **Network**: VPC isolation, security groups, NACLs
3. **Application**: Input validation, rate limiting
4. **Data**: Encryption at rest (KMS), in transit (TLS 1.3)
5. **Identity**: Cognito MFA, IAM roles
6. **Audit**: CloudTrail, Config, GuardDuty

### Compliance
- GDPR considerations (data retention)
- PCI DSS for payment data (handled by Paystack/Flutterwave)
- Nigerian Data Protection Regulation (NDPR)

## Technology Compatibility Matrix

| Component | Technology | Version | Compatible With | Proven at Scale |
|-----------|------------|---------|-----------------|-----------------|
| Backend Runtime | Node.js | 20.x LTS | All AWS services | ✅ Yes |
| Backend Framework | Express.js | 4.18+ | API Gateway, Lambda | ✅ Yes |
| AI Framework | LangChain | 0.1.0+ | Bedrock, OpenSearch | ✅ Yes |
| LLM | LLaMA 3.1 | 8B/70B | Bedrock | ✅ Yes |
| Database | Aurora PostgreSQL | 15.x | Serverless v2 | ✅ Yes |
| Vector Store | OpenSearch | 2.11+ | Serverless | ✅ Yes |
| Cache | ElastiCache Redis | 7.0+ | Cluster mode | ✅ Yes |
| Frontend | React | 18.x | Cognito, API | ✅ Yes |
| UI Library | Chakra UI | 2.8+ | React 18 | ✅ Yes |
| IaC | Terraform | 1.5+ | AWS Provider 5.0+ | ✅ Yes |
| Container | Docker | 24.x | ECS Fargate | ✅ Yes |
| WhatsApp API | Meta Cloud API | v18.0 | Webhooks | ✅ Yes |
| Payment | Paystack | v2 | Nigeria | ✅ Yes |
| Payment | Flutterwave | v3 | Nigeria | ✅ Yes |

### Verified Integrations
- ✅ Bedrock + LLaMA 3.1: Full support for text generation
- ✅ OpenSearch + LangChain: Vector similarity search
- ✅ Aurora Serverless v2: Auto-scaling PostgreSQL
- ✅ Paystack: Nigerian Naira support, mobile money
- ✅ Flutterwave: Bank transfers, USSD
- ✅ Meta WhatsApp Cloud API: Media, templates, webhooks

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Message Processing | <2s | p95 latency |
| AI Response Generation | <3s | p95 latency |
| Database Queries | <100ms | p95 latency |
| API Response | <500ms | p95 latency |
| Concurrent Users | 10,000+ | Sustained |
| Messages per Second | 100+ | Peak |
| Dashboard Load Time | <1s | First contentful paint |

## Cost Efficiency

### Serverless-First Approach
- Lambda for webhooks (pay per invocation)
- Aurora Serverless v2 (pay per ACU-hour)
- S3 Intelligent-Tiering (automatic cost optimization)
- OpenSearch Serverless (no instance management)

### Reserved Capacity for Predictable Loads
- ECS Savings Plans for steady-state compute
- RDS Reserved Instances for production DB
- CloudFront savings through commitment

### Cost Monitoring
- AWS Cost Explorer dashboards
- Budget alerts at 80%, 100%, 120%
- Resource tagging for cost allocation
- Daily cost reports to stakeholders

## Roadmap Integration Points

### Phase 1 (MVP - Month 1-2)
- Basic WhatsApp integration
- Simple AI responses (Bedrock)
- Order processing
- Payment integration
- Admin dashboard

### Phase 2 (Month 3-4)
- RAG with product catalog
- Multi-language support
- Analytics dashboard
- Automated reminders
- Invoice generation

### Phase 3 (Month 5-6)
- Advanced AI (fine-tuned LLaMA)
- Voice message support
- Image recognition
- CRM features
- Mobile app

### Phase 4 (Month 7+)
- Multi-tenant SaaS
- White-label options
- Advanced analytics
- API marketplace
- Regional expansion

## Success Metrics

### Technical Metrics
- System uptime > 99.9%
- Response time p95 < 2s
- Error rate < 0.1%
- Cost per conversation < ₦20

### Business Metrics
- Monthly Active Businesses (MAB)
- Messages processed per month
- Customer satisfaction (CSAT) > 4.5/5
- Revenue per customer > ₦15,000/month
- Customer acquisition cost (CAC) < ₦10,000
- Lifetime value (LTV) > ₦500,000

## Next Steps

1. Review [AWS Architecture](02-aws-architecture.md)
2. Understand [Database Design](03-database-design.md)
3. Learn [LLM Pipeline](04-llm-pipeline.md)
4. Study [Security Model](05-security.md)
5. Follow [Deployment Guide](../guides/deployment.md)

---

**Document Version**: 1.0
**Last Updated**: December 24, 2025
**Author**: WazAssist Engineering Team
