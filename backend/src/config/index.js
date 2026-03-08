import dotenv from 'dotenv';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

dotenv.config();

async function loadSecretsManagerEnv() {
  const secretId = process.env.AWS_SECRETS_MANAGER_SECRET_ID;
  if (!secretId) return;

  try {
    const region = process.env.AWS_REGION || 'us-east-1';
    const client = new SecretsManagerClient({ region });
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await client.send(command);

    if (!response.SecretString) return;

    const secrets = JSON.parse(response.SecretString);
    for (const [key, value] of Object.entries(secrets)) {
      if (value === undefined || value === null) continue;
      process.env[key] = String(value);
    }
  } catch (error) {
    console.warn(`Failed to load AWS Secrets Manager secret ${secretId}: ${error.message}`);
  }
}

await loadSecretsManagerEnv();

export const config = {
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appName: process.env.APP_NAME || 'WazAssist AI',

  // App
  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    logoUrl: process.env.APP_LOGO_URL || ''
  },

  // URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'http://localhost:3000/webhooks',

  // AWS
  aws: {
    region: process.env.AWS_REGION || 'eu-west-1',
    accountId: process.env.AWS_ACCOUNT_ID,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },

  // Database
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'wazassist',
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DATABASE_SSL === 'true',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '5', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '20', 10)
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true'
  },

  // AWS Bedrock
  bedrock: {
    model8b: process.env.BEDROCK_MODEL_ID_8B || 'meta.llama3-1-8b-instruct-v1:0',
    model70b: process.env.BEDROCK_MODEL_ID_70B || 'meta.llama3-1-70b-instruct-v1:0',
    defaultModel: process.env.BEDROCK_DEFAULT_MODEL || '8B',
    maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '2048', 10),
    temperature: parseFloat(process.env.BEDROCK_TEMPERATURE || '0.7')
  },

  // OpenSearch
  opensearch: {
    endpoint: process.env.OPENSEARCH_ENDPOINT,
    indexProducts: process.env.OPENSEARCH_INDEX_PRODUCTS || 'products',
    indexConversations: process.env.OPENSEARCH_INDEX_CONVERSATIONS || 'conversations'
  },

  // S3
  s3: {
    bucketMedia: process.env.S3_BUCKET_MEDIA,
    bucketInvoices: process.env.S3_BUCKET_INVOICES,
    bucketTraining: process.env.S3_BUCKET_TRAINING,
    region: process.env.S3_REGION || 'eu-west-1'
  },

  // SQS
  sqs: {
    queueMessages: process.env.SQS_QUEUE_MESSAGES,
    queueInvoices: process.env.SQS_QUEUE_INVOICES
  },

  // SNS
  sns: {
    topicOrders: process.env.SNS_TOPIC_ORDERS,
    topicAlerts: process.env.SNS_TOPIC_ALERTS
  },

  // Cognito
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    region: process.env.COGNITO_REGION || 'eu-west-1'
  },

  // WhatsApp
  whatsapp: {
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET
  },

  // Paystack
  paystack: {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL
  },

  // Flutterwave
  flutterwave: {
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
    secretHash: process.env.FLUTTERWAVE_SECRET_HASH,
    callbackUrl: process.env.FLUTTERWAVE_CALLBACK_URL
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // API
  api: {
    key: process.env.API_KEY || process.env.JWT_SECRET // Fallback to JWT_SECRET for development
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    whatsappMax: parseInt(process.env.RATE_LIMIT_WHATSAPP_MAX || '1000', 10)
  },

  // AI
  ai: {
    responseTimeoutMs: parseInt(process.env.AI_RESPONSE_TIMEOUT_MS || '5000', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
    cacheEnabled: process.env.AI_CACHE_ENABLED === 'true',
    cacheTtl: parseInt(process.env.AI_CACHE_TTL || '3600', 10),
    fallbackEnabled: process.env.AI_FALLBACK_ENABLED === 'true',
    fallbackMessage: process.env.AI_FALLBACK_MESSAGE || "Sorry, I'm having trouble right now."
  },

  // Multilingual
  languages: {
    default: process.env.DEFAULT_LANGUAGE || 'en',
    supported: (process.env.SUPPORTED_LANGUAGES || 'en,pidgin,yoruba,igbo,hausa').split(',')
  },

  // Business Rules
  business: {
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '4096', 10),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '16', 10),
    orderTimeoutMinutes: parseInt(process.env.ORDER_TIMEOUT_MINUTES || '30', 10),
    sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60', 10),
    lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '10', 10)
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    cloudwatchLogGroup: process.env.CLOUDWATCH_LOG_GROUP || '/aws/ecs/wazassist',
    cloudwatchLogStream: process.env.CLOUDWATCH_LOG_STREAM || 'backend',
    enableXray: process.env.ENABLE_XRAY === 'true'
  },

  // Feature Flags
  features: {
    aiEnabled: process.env.FEATURE_AI_ENABLED !== 'false',
    voiceMessages: process.env.FEATURE_VOICE_MESSAGES === 'true',
    imageRecognition: process.env.FEATURE_IMAGE_RECOGNITION === 'true',
    multiAgent: process.env.FEATURE_MULTI_AGENT === 'true',
    analytics: process.env.FEATURE_ANALYTICS !== 'false'
  },

  // Subscription Tiers
  tiers: {
    starter: {
      messageLimit: parseInt(process.env.TIER_STARTER_MESSAGE_LIMIT || '500', 10),
      price: parseInt(process.env.PRICE_STARTER_MONTHLY || '5000', 10)
    },
    growth: {
      messageLimit: parseInt(process.env.TIER_GROWTH_MESSAGE_LIMIT || '2500', 10),
      price: parseInt(process.env.PRICE_GROWTH_MONTHLY || '15000', 10)
    },
    pro: {
      messageLimit: parseInt(process.env.TIER_PRO_MESSAGE_LIMIT || '10000', 10),
      price: parseInt(process.env.PRICE_PRO_MONTHLY || '40000', 10)
    },
    enterprise: {
      messageLimit: parseInt(process.env.TIER_ENTERPRISE_MESSAGE_LIMIT || '100000', 10),
      price: null // Custom pricing
    }
  },

  // Development
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  debug: process.env.DEBUG === 'true',
  mockWhatsapp: process.env.MOCK_WHATSAPP === 'true',
  mockPayments: process.env.MOCK_PAYMENTS === 'true',
  mockAi: process.env.MOCK_AI === 'true'
};

// Validation
const requiredEnvVars = [
  'DATABASE_HOST',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'JWT_SECRET',
  'WHATSAPP_VERIFY_TOKEN'
];

if (config.isProduction) {
  requiredEnvVars.push(
    'AWS_REGION',
    'REDIS_HOST',
    'OPENSEARCH_ENDPOINT',
    'S3_BUCKET_MEDIA',
    'PAYSTACK_SECRET_KEY',
    'COGNITO_USER_POOL_ID'
  );
}

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export default config;
