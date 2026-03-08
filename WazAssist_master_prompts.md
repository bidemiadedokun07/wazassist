✅ MASTER PROMPT: Build WazAssist AI (End-to-End WhatsApp AI Business
Agent)

BEGIN PROMPT

You are an expert Senior Cloud Architect, AI Engineer, and Full-Stack
Lead.

Help me design and fully build WazAssist AI, an AI-powered WhatsApp
Business Assistant for Nigerian SMEs.

I want an end-to-end enterprise solution using AWS-heavy architecture
with production-grade components.

⸻

💡 SYSTEM DESCRIPTION

WazAssist AI is an AI WhatsApp Business Sales Assistant that can:

• Respond automatically to customers

• Generate invoices and receipts

• Manage product catalog

• Track orders

• Send follow-up reminders

• Provide inventory information

• Support English, Pidgin, Yoruba, Igbo, Hausa

• Provide analytics and sales reports

• Handle 24/7 customer messaging

• Integrate payments (Paystack/Flutterwave)

• Serve millions of SMEs

It must be reliable, scalable, secure, and optimized for low latency.

⸻

🎯 OBJECTIVES

Create the entire system including:

1\. High-level system design

2\. AWS reference architecture diagram

3\. Backend architecture

4\. LLM architecture (LLaMA fine-tuning pipeline)

5\. WhatsApp Business API integration

6\. RAG workflows for product catalog

7\. Prompt orchestration + agent workflow

8\. CI/CD using AWS CodePipeline

9\. IaC using Terraform

10\. Monitoring, logging, and scaling

11\. Frontend web dashboard

12\. Database schema

13\. Security and permissions model (IAM)

14\. Cost-optimized plans

15\. Testing plan

16\. Deployment guide

17\. API documentation

18\. GitHub repo structure

19\. Business model & pricing

20\. Go-to-market plan

⸻

🧠 LLM REQUIREMENTS

Use:

• LLaMA 3.1 8B or 70B (finetuned)

• Amazon Bedrock for hosting inference

• Amazon S3 for training data

• Amazon SageMaker for training & finetuning

• Vector store: Amazon OpenSearch Serverless

Include:

• Fine-tuning pipeline

• Chat inference server

• Multi-language support

• Chat memory

• Hallucination control

⸻

🔗 WHATSAPP BUSINESS API REQUIREMENTS

Build an integration layer using:

• Meta WhatsApp Cloud API or

• Third-party BSP like 360Dialog

Include:

• Webhook handler

• Message routing module

• Rate-limit protection

• Fallback/queue system

• Chat session tracking

• File upload & image analysis support

⸻

🚀 AWS HEAVY ARCHITECTURE

Use the following AWS services:

• Amazon API Gateway

• AWS Lambda

• AWS ECS Fargate for backend containers

• AWS SQS for message queueing

• AWS SNS for notifications

• Amazon Aurora Serverless (PostgreSQL)

• Amazon S3 for assets and training data

• Amazon CloudFront for CDN

• AWS Cognito for authentication

• AWS IAM with granular roles

• AWS KMS for encryption

• AWS WAF + Shield for protection

• Amazon CloudWatch (metrics, logs)

• AWS OpenSearch (vector store + semantic search)

• Amazon EventBridge for event orchestration

• AWS CodePipeline + CodeBuild + CodeDeploy

• Elastic Load Balancer (ALB)

• VPC, private subnets, NAT gateways

⸻

📦 BACKEND FUNCTIONAL MODULES

Generate detailed code-level descriptions for:

1\. User onboarding

2\. Business profile creation

3\. Product catalog RAG ingestion

4\. AI message handler

5\. NLP/LLM routing engine

6\. Order processing module

7\. Inventory tracking

8\. Invoice generator (PDF)

9\. CRM module

10\. Analytics engine

11\. Multilingual module

12\. Notifications module

13\. Admin dashboard backend

⸻

⚙️ FRONTEND DASHBOARD

Using React + Chakra UI:

• Login (Cognito)

• Sales dashboard analytics

• Product catalog management

• Customer profiles

• Chat history viewer

• Invoice viewer

• Settings page

• Subscription & billing page

⸻

📁 DATABASE DESIGN

Create:

• ER diagram

• Table schemas

• Indices

• Data retention policy

Use Aurora PostgreSQL.

⸻

🔐 SECURITY

Define:

• IAM roles

• API Gateway throttling

• JWT auth via Cognito

• Network isolation using VPC

• KMS encryption

• S3 bucket policies

• WAF rules

• Rate limiters

⸻

🧪 TESTING REQUIREMENTS

Include:

• Unit testing

• Integration testing

• Load testing

• Security testing

• LLM output validation testing

Using:

• pytest

• k6

• Postman

• AWS Fault Injection Simulator

⸻

📦 DEPLOYMENT

Provide:

1\. End-to-end deployment instructions

2\. Terraform for AWS

3\. Docker files

4\. CI/CD workflow

5\. Monitoring dashboards

⸻

💵 COST OPTIMIZATION

Provide:

• Monthly cost table

• Low-budget starter architecture

• Mid-tier production architecture

• High-scale enterprise architecture

⸻

💸 BUSINESS PLAN

Include:

• Pricing tiers

• Acquisition strategy

• First 6 months roadmap

• KPI metrics

• Scaling plan

• Team structure

⸻

📑 DELIVERABLE FORMAT

Please structure your response clearly:

• Section titles

• Diagrams (ASCII or Mermaid)

• Tables

• Code blocks

• Bullet lists

END PROMPT
