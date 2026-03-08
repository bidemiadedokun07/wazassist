# WazAssist AI - WhatsApp Business AI Assistant

**Production-Grade AI-Powered WhatsApp Business Solution for Nigerian SMEs**

## Overview

WazAssist AI is an enterprise-level WhatsApp Business Assistant that helps Nigerian SMEs automate customer interactions, manage orders, generate invoices, and provide 24/7 multilingual support in English, Pidgin, Yoruba, Igbo, and Hausa.

## Key Features

- **AI-Powered Conversations**: LLaMA 3.1-based responses via Amazon Bedrock
- **Multilingual Support**: English, Pidgin, Yoruba, Igbo, Hausa
- **Order Management**: Track orders, generate invoices, manage inventory
- **Payment Integration**: Paystack & Flutterwave support
- **Product Catalog RAG**: AI-powered product recommendations
- **Analytics Dashboard**: Real-time sales and customer insights
- **24/7 Availability**: Automated customer support
- **Scalable Architecture**: AWS-native, serverless-first design

## Architecture

### Technology Stack

**Backend:**
- Runtime: Node.js 20.x / Python 3.11
- Framework: Express.js / FastAPI
- Database: Amazon Aurora PostgreSQL Serverless
- Cache: Amazon ElastiCache Redis
- Queue: AWS SQS
- Storage: Amazon S3

**AI/ML:**
- LLM: LLaMA 3.1 8B/70B via Amazon Bedrock
- Vector Store: Amazon OpenSearch Serverless
- Training: Amazon SageMaker
- RAG: LangChain + OpenSearch

**Frontend:**
- Framework: React 18 + TypeScript
- UI Library: Chakra UI
- State: React Query + Zustand
- Auth: AWS Cognito

**Infrastructure:**
- Cloud: AWS (Multi-AZ)
- IaC: Terraform
- Containers: Docker + ECS Fargate
- CI/CD: AWS CodePipeline
- Monitoring: CloudWatch + X-Ray

**WhatsApp:**
- Meta WhatsApp Cloud API / 360Dialog
- Webhook handling via API Gateway + Lambda

## Project Structure

```
WazAssist_App/
├── backend/                 # Backend services
│   ├── src/
│   │   ├── api/            # REST API routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   ├── utils/          # Helpers
│   │   └── config/         # Configuration
│   └── tests/              # Backend tests
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page views
│   │   ├── services/       # API clients
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilities
│   └── public/             # Static assets
├── infrastructure/         # IaC and deployment
│   ├── terraform/          # Terraform modules
│   └── docker/             # Dockerfiles
├── docs/                   # Documentation
│   ├── architecture/       # System design
│   │   ├── 01-system-overview.md
│   │   ├── 02-aws-architecture.md
│   │   ├── 03-database-design.md
│   │   ├── 04-llm-pipeline.md
│   │   └── 05-security.md
│   ├── api/               # API documentation
│   ├── guides/            # Deployment & development guides
│   └── business/          # Business plan & pricing
├── scripts/               # Automation scripts
├── data/                  # Training & product data
└── .github/               # CI/CD workflows
```

## Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- Node.js 20.x or Python 3.11
- Docker Desktop
- Terraform 1.5+
- WhatsApp Business API credentials

### Low-Cost Starter Setup (₦50k-100k/month)

```bash
# 1. Clone and install dependencies
npm install  # or pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Deploy starter infrastructure
cd infrastructure/terraform/environments/starter
terraform init
terraform plan
terraform apply

# 4. Deploy backend
npm run deploy:starter

# 5. Deploy frontend
cd frontend && npm run build
npm run deploy
```

### Full Production Setup

See [Deployment Guide](docs/guides/deployment.md)

## Cost Optimization

### Tier 1: Starter (₦50k-100k/month)
- Lambda + API Gateway (serverless)
- Aurora Serverless v2 (0.5 ACU min)
- S3 + CloudFront
- Bedrock pay-per-use
- Handles 1,000-5,000 conversations/month

### Tier 2: Growth (₦200k-500k/month)
- ECS Fargate (2 tasks)
- Aurora Serverless v2 (1-4 ACU)
- OpenSearch Serverless
- SQS + SNS
- Handles 10,000-50,000 conversations/month

### Tier 3: Enterprise (₦1M-2M/month)
- ECS Fargate (auto-scaling 5-20 tasks)
- Aurora Multi-AZ
- OpenSearch provisioned
- Advanced monitoring
- Handles 100,000+ conversations/month

## Revenue Model

### SaaS Pricing (Per Business)
- **Starter**: ₦5,000/month (500 msgs, 1 agent)
- **Growth**: ₦15,000/month (2,500 msgs, 3 agents)
- **Pro**: ₦40,000/month (10,000 msgs, 10 agents)
- **Enterprise**: Custom pricing

### Additional Revenue Streams
1. Transaction fees on payments (0.5-1%)
2. Premium features (AI training, advanced analytics)
3. White-label licensing
4. Educational course sales
5. Consulting services

## Educational Content

This project includes comprehensive guides for teaching Full Stack AI Development:

1. **Architecture Deep Dive** - AWS cloud architecture patterns
2. **LLM Integration Guide** - Working with Bedrock, SageMaker, RAG
3. **Backend Development** - Building scalable APIs
4. **Frontend Development** - Modern React patterns
5. **DevOps & IaC** - Terraform, Docker, CI/CD
6. **Business Strategy** - Monetization and scaling

See [docs/guides/educational/](docs/guides/educational/) for detailed tutorials.

## Security

- **Authentication**: AWS Cognito with MFA
- **Authorization**: IAM roles with least privilege
- **Encryption**: KMS for data at rest, TLS 1.3 in transit
- **Network**: VPC with private subnets, WAF + Shield
- **Compliance**: Data residency in eu-west-1 or us-east-1
- **Rate Limiting**: API Gateway + custom middleware

## Monitoring & Observability

- CloudWatch Logs & Metrics
- X-Ray distributed tracing
- Custom business metrics
- Real-time alerting (SNS)
- Daily cost reports

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Load testing
npm run test:load

# Security scanning
npm run test:security
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Proprietary - All Rights Reserved

## Support

- Documentation: [docs/](docs/)
- Issues: GitHub Issues
- Email: support@wazassist.ai

---

**Built for Nigerian SMEs | Powered by AWS & AI**

*Last Updated: December 24, 2025*
