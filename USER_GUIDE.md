# WazAssist AI - User Guide

Welcome to WazAssist AI! This guide will help you get started with managing your business using our AI-powered WhatsApp assistant.

## Table of Contents
- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Managing Your Business Profile](#managing-your-business-profile)
- [Product Management](#product-management)
- [Order Management](#order-management)
- [Customer Conversations](#customer-conversations)
- [Analytics & Reporting](#analytics--reporting)
- [Settings & Configuration](#settings--configuration)
- [Billing & Subscriptions](#billing--subscriptions)
- [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Getting Started

### Creating Your Account

1. **Visit the Registration Page**
   - Navigate to the WazAssist AI dashboard
   - Click "Sign Up" or "Create Account"

2. **Enter Your Information**
   - **Name**: Your full name
   - **Phone Number**: Must include country code (e.g., +234XXXXXXXXXX)
   - **Email**: Your business email address
   - **Password**: Minimum 8 characters, including uppercase, lowercase, number, and special character

3. **Verify Your Account**
   - Check your email for verification link
   - Click the link to activate your account

4. **First Login**
   - Enter your phone number and password
   - You'll be redirected to the dashboard

### Quick Start Checklist

After logging in for the first time, complete these essential steps:

- [ ] Set up your business profile
- [ ] Connect WhatsApp Business account
- [ ] Add your first products (at least 5-10)
- [ ] Configure business settings
- [ ] Set up payment methods
- [ ] Test the AI assistant
- [ ] Invite team members (if needed)

---

## Dashboard Overview

The dashboard is your command center for managing your business on WhatsApp.

### Main Navigation

Located on the left sidebar:

**📊 Dashboard** - Overview of key metrics and recent activity

**📦 Products** - Manage your product catalog

**🛒 Orders** - View and manage customer orders

**💬 Conversations** - Customer chat history and active conversations

**📈 Analytics** - Business performance insights and reports

**⚙️ Settings** - Business profile, account settings, and configuration

### Dashboard Widgets

**Revenue Summary**
- Total revenue for selected period
- Growth percentage vs previous period
- Revenue trend chart

**Order Statistics**
- Total orders
- Orders by status (pending, completed, cancelled)
- Average order value

**Product Inventory**
- Total products
- Low stock alerts
- Out of stock items

**Customer Engagement**
- Active conversations
- Response time
- Customer satisfaction score

---

## Managing Your Business Profile

### Setting Up Your Business Profile

1. **Navigate to Settings > Business Profile**

2. **Complete Business Information**
   - **Business Name**: Your registered business name
   - **Business Category**: Select from dropdown (Fashion, Electronics, Food, etc.)
   - **Description**: Brief description of your business
   - **Phone Number**: Your business contact number
   - **Email**: Business email address
   - **Address**: Physical business location

3. **Upload Business Logo**
   - Click "Upload Logo"
   - Select image file (PNG, JPG - max 2MB)
   - Crop and adjust as needed
   - Save changes

4. **WhatsApp Integration**
   - **Phone Number ID**: From Meta Business Account
   - **Access Token**: From Meta Developer Console
   - Click "Connect WhatsApp" to verify

5. **Save Your Changes**
   - Review all information
   - Click "Save Changes"

### WhatsApp Business Setup

To connect your WhatsApp Business account:

1. **Create Meta Business Account**
   - Visit business.facebook.com
   - Create or log into your business account
   - Add WhatsApp Business

2. **Get API Credentials**
   - Go to Meta Developer Console
   - Select your app
   - Navigate to WhatsApp > Configuration
   - Copy Phone Number ID and Access Token

3. **Configure Webhook**
   - Webhook URL: `https://api.wazassist.ai/webhooks/whatsapp`
   - Verify Token: (provided in Settings)
   - Subscribe to messages, messaging_postbacks

4. **Enter Credentials in WazAssist**
   - Settings > Business Profile
   - Paste Phone Number ID
   - Paste Access Token
   - Click "Verify Connection"

---

## Product Management

### Adding Products

1. **Navigate to Products Page**
   - Click "Products" in sidebar
   - Click "+ Add Product" button

2. **Enter Product Details**
   - **Name**: Product name (required)
   - **Description**: Detailed product description
   - **Price**: Product price in Naira (NGN)
   - **Category**: Select or create category
   - **SKU**: Stock Keeping Unit (optional)
   - **Stock Quantity**: Available inventory
   - **Low Stock Threshold**: Alert level (default: 5)

3. **Upload Product Images**
   - Click "Add Images"
   - Upload up to 5 images
   - Drag to reorder (first image is primary)
   - Add alt text for accessibility

4. **Additional Options**
   - **Variants**: Add sizes, colors, etc.
   - **Tags**: For search and filtering
   - **Weight/Dimensions**: For shipping
   - **Status**: Active/Inactive

5. **Save Product**
   - Click "Save Product"
   - Product appears in catalog immediately

### Bulk Product Import

For importing multiple products at once:

1. **Download Template**
   - Products page > "Import Products"
   - Download CSV template

2. **Fill Template**
   - Follow column headers
   - One product per row
   - Save as CSV file

3. **Upload CSV**
   - Click "Choose File"
   - Select your CSV
   - Click "Import"
   - Review errors (if any)

### Managing Product Inventory

**Low Stock Alerts**
- Dashboard shows products below threshold
- Click product to update quantity
- Set reorder reminders

**Stock Adjustments**
- Click product > Edit
- Update "Stock Quantity"
- Add adjustment note
- Save changes

**Product Status**
- **Active**: Visible to customers, can be ordered
- **Inactive**: Hidden from catalog, no orders
- **Out of Stock**: Visible but unavailable

### Product Categories

Organize products for easy browsing:

1. **Create Category**
   - Products > Categories > "Add Category"
   - Enter name and description
   - Save

2. **Assign Products**
   - Edit product
   - Select category from dropdown
   - Save

3. **Featured Products**
   - Mark products as "Featured"
   - Appear first in catalog
   - AI recommends to customers

---

## Order Management

### Order Lifecycle

Orders progress through these statuses:

1. **Pending** - New order, awaiting confirmation
2. **Confirmed** - Order accepted, processing begins
3. **Processing** - Order being prepared
4. **Shipped** - Order dispatched to customer
5. **Delivered** - Order received by customer
6. **Cancelled** - Order cancelled (by customer or business)

### Viewing Orders

**All Orders**
- Orders page shows all orders
- Filter by status, date, customer
- Search by order number or customer name

**Order Details**
- Click order to view full details:
  - Customer information
  - Ordered items with quantities
  - Pricing and payment status
  - Delivery address
  - Order timeline
  - Chat with customer

### Processing Orders

**Confirming Orders**
1. Review order details
2. Check product availability
3. Click "Confirm Order"
4. Customer receives confirmation via WhatsApp

**Updating Order Status**
1. Open order details
2. Click current status
3. Select new status from dropdown
4. Add optional note
5. Customer receives automatic update

**Shipping Orders**
1. Status > "Shipped"
2. Enter tracking number (optional)
3. Select courier/delivery method
4. Customer receives tracking info

**Cancelling Orders**
1. Click "Cancel Order"
2. Select cancellation reason
3. Process refund (if paid)
4. Notify customer

### Payment Management

**Payment Statuses**
- **Pending**: Payment not received
- **Paid**: Payment confirmed
- **Failed**: Payment attempt failed
- **Refunded**: Payment returned to customer

**Processing Payments**
- Integrated with Paystack and Flutterwave
- Customers pay via WhatsApp payment link
- Automatic confirmation on successful payment
- Manual confirmation available for bank transfers

### Order Fulfillment Tips

**Quick Actions**
- Use keyboard shortcuts (coming soon)
- Bulk status updates
- Print packing slips
- Export order data

**Customer Communication**
- Send order updates automatically
- Add personal notes to orders
- Quick reply templates
- Set up auto-responses

---

## Customer Conversations

### Viewing Conversations

**Conversation List**
- Click "Conversations" in sidebar
- Shows all customer chats
- Filter by status (active/closed)
- Search by customer name/number

**Conversation Details**
- Click conversation to view
- Full message history
- Customer information
- Previous orders
- Quick actions

### AI Assistant Features

WazAssist AI automatically handles:

**Product Inquiries**
- Answers questions about products
- Provides pricing and availability
- Shows product images
- Explains features and specifications

**Order Assistance**
- Helps customers place orders
- Calculates totals and shipping
- Accepts payment
- Sends order confirmations

**Order Tracking**
- Provides order status updates
- Shares tracking information
- Estimates delivery times

**General Support**
- Business hours and location
- Return and refund policies
- Shipping information
- Contact details

### Taking Over Conversations

When AI needs human help:

1. You'll receive notification
2. Click conversation to view
3. Type and send messages manually
4. Click "Resolve" when done
5. AI resumes handling

### Setting Up AI Responses

**Custom Responses**
- Settings > AI Configuration
- Add FAQs and answers
- Set business policies
- Configure tone and style

**Response Templates**
- Create saved responses
- Use variables (customer name, order number)
- Quick insert in conversations

---

## Analytics & Reporting

### Key Metrics

**Revenue Metrics**
- Total revenue
- Revenue by period (day/week/month)
- Revenue growth rate
- Average order value

**Order Metrics**
- Total orders
- Orders by status
- Conversion rate
- Order fulfillment time

**Product Performance**
- Best-selling products
- Low-performing products
- Inventory turnover
- Stock levels

**Customer Insights**
- New vs returning customers
- Customer lifetime value
- Geographic distribution
- Peak ordering times

### Revenue Dashboard

**Charts and Graphs**
- Revenue trend line (7/30/90 days)
- Order volume bar chart
- Product category pie chart
- Top products table

**Filters**
- Date range selector
- Business comparison (if multiple)
- Product category filter
- Customer segment filter

### Exporting Data

**Export Options**
- CSV format
- Excel spreadsheet
- PDF report

**Data Types**
- Order history
- Product catalog
- Customer list
- Revenue reports

**Export Steps**
1. Analytics > Select report type
2. Set filters and date range
3. Click "Export"
4. Choose format
5. Download file

---

## Settings & Configuration

### Account Settings

**Personal Information**
- Update name and email
- Change phone number
- Update profile picture

**Security**
- Change password
- Enable two-factor authentication
- Manage active sessions
- View login history

**Notifications**
- Email notifications
- SMS alerts
- Push notifications
- Notification frequency

### Business Settings

**Operating Hours**
- Set business hours
- Configure holidays
- Auto-reply when closed

**Shipping Settings**
- Shipping zones
- Delivery fees
- Free shipping threshold
- Estimated delivery times

**Tax Settings**
- VAT rate
- Tax-inclusive pricing
- Tax exemptions

**Currency & Localization**
- Currency (NGN default)
- Date format
- Time zone
- Language preference

### Payment Settings

**Payment Gateways**
- Connect Paystack
- Connect Flutterwave
- Bank transfer details
- Cash on delivery options

**Payout Settings**
- Bank account details
- Payout schedule
- Minimum payout amount

### AI Configuration

**AI Behavior**
- Response tone (professional/friendly/casual)
- Language preferences
- Confidence threshold
- Human handoff triggers

**Business Knowledge**
- FAQs
- Policies (returns, shipping, etc.)
- Product descriptions
- Special instructions

---

## Billing & Subscriptions

### Subscription Tiers

**Starter Plan** - ₦5,000/month
- 500 messages per month
- 1 WhatsApp number
- Basic AI assistant
- Email support

**Growth Plan** - ₦15,000/month
- 2,500 messages per month
- Up to 3 WhatsApp numbers
- Advanced AI features
- Priority support
- Custom branding

**Pro Plan** - ₦40,000/month
- 10,000 messages per month
- Up to 10 WhatsApp numbers
- Full AI capabilities
- Multi-agent support
- API access
- Dedicated account manager

**Enterprise** - Custom Pricing
- Unlimited messages
- Unlimited WhatsApp numbers
- Custom integrations
- White-label solution
- 24/7 phone support
- SLA guarantee

### Managing Your Subscription

**Upgrade/Downgrade**
1. Settings > Billing
2. Click "Change Plan"
3. Select new plan
4. Confirm changes
5. Changes take effect immediately

**Payment Methods**
- Add credit/debit card
- Bank transfer
- Standing order
- USSD payment

**Billing History**
- View all invoices
- Download receipts
- Export for accounting

### Message Usage

**Monitoring Usage**
- Dashboard shows current usage
- Progress bar to limit
- Alerts at 80% and 100%

**Overage Charges**
- ₦15 per 100 messages over limit
- Billed at end of month
- Automatic payment from saved method

---

## FAQ & Troubleshooting

### Common Questions

**Q: How do I connect my WhatsApp Business account?**
A: Go to Settings > Business Profile, enter your Phone Number ID and Access Token from Meta Business Manager, then click "Connect WhatsApp".

**Q: Why aren't customers seeing my products?**
A: Check that products are marked as "Active" and have stock quantity > 0. Also verify WhatsApp connection is working.

**Q: How do I process refunds?**
A: Open the order, click "Cancel Order", select refund reason, and process refund through your payment gateway.

**Q: Can I have multiple team members?**
A: Yes! Go to Settings > Team and invite members with different roles (Admin, Manager, Staff).

**Q: How does the AI know about my products?**
A: The AI reads your product catalog in real-time. Any changes you make are immediately available to the AI.

**Q: What happens when I reach my message limit?**
A: You'll receive alerts at 80% usage. At 100%, you can either upgrade or pay overage charges of ₦15 per 100 messages.

**Q: Can I export my data?**
A: Yes! Go to Analytics > Export to download your data in CSV or Excel format.

### Troubleshooting

**Issue: Can't log in**
- Verify phone number includes country code
- Check password (case-sensitive)
- Clear browser cache
- Try password reset

**Issue: WhatsApp not connected**
- Verify credentials from Meta
- Check webhook is configured
- Ensure app is approved by Meta
- Contact support for verification

**Issue: Orders not appearing**
- Check internet connection
- Refresh the page
- Verify WhatsApp integration
- Check AI is enabled

**Issue: Products not showing in catalog**
- Ensure product status is "Active"
- Check stock quantity > 0
- Verify business is active
- Refresh product catalog

**Issue: AI giving wrong answers**
- Update product information
- Add FAQs in Settings > AI Configuration
- Review AI training data
- Contact support for AI tuning

### Getting Help

**Support Channels**
- **Email**: support@wazassist.ai
- **Phone**: +234-XXX-XXX-XXXX (Pro+ plans)
- **Live Chat**: Available in dashboard
- **Help Center**: help.wazassist.ai

**Support Hours**
- Email: 24/7
- Phone: Monday-Friday, 9 AM - 6 PM WAT
- Live Chat: Monday-Saturday, 8 AM - 10 PM WAT

**Before Contacting Support**
- Have your account details ready
- Screenshot any error messages
- Note the steps to reproduce issue
- Check system status page

---

## Best Practices

### Product Management
- Use high-quality product images
- Write detailed descriptions
- Keep inventory updated
- Set appropriate low stock thresholds
- Use consistent naming conventions

### Order Fulfillment
- Confirm orders within 1 hour
- Update statuses promptly
- Communicate with customers
- Process refunds quickly
- Request customer feedback

### Customer Service
- Respond to queries within 15 minutes
- Use friendly, professional tone
- Be transparent about policies
- Go extra mile for resolution
- Follow up on complaints

### Analytics
- Review dashboard daily
- Track key metrics weekly
- Analyze trends monthly
- Adjust strategy based on data
- Set and monitor goals

---

## Tips for Success

**Growing Your Business**
- Promote your WhatsApp number
- Offer first-time customer discounts
- Create product bundles
- Run seasonal promotions
- Encourage customer reviews

**Optimizing AI Performance**
- Keep product info current
- Add comprehensive FAQs
- Review AI conversations weekly
- Provide feedback on AI responses
- Train AI with your terminology

**Improving Customer Experience**
- Fast order confirmation
- Clear communication
- Accurate product descriptions
- Reliable delivery
- Easy returns process

---

## Keyboard Shortcuts

**Navigation**
- `Ctrl/Cmd + D` - Dashboard
- `Ctrl/Cmd + P` - Products
- `Ctrl/Cmd + O` - Orders
- `Ctrl/Cmd + C` - Conversations
- `Ctrl/Cmd + A` - Analytics
- `Ctrl/Cmd + ,` - Settings

**Actions**
- `N` - New product/order
- `E` - Edit selected item
- `Del` - Delete selected item
- `/` - Search
- `Esc` - Close modal
- `?` - Show keyboard shortcuts

---

## Updates & Changelog

Check our changelog for new features and improvements:

**Recent Updates**
- Enhanced AI conversation handling
- Improved analytics dashboard
- Bulk product import
- Multi-currency support (coming soon)
- Mobile app (coming soon)

---

## Community & Resources

**Join Our Community**
- Facebook Group: facebook.com/groups/wazassist
- Twitter: @WazAssistAI
- LinkedIn: linkedin.com/company/wazassist
- YouTube: youtube.com/wazassist (tutorials)

**Additional Resources**
- Video Tutorials
- Webinars
- Blog Articles
- Case Studies
- API Documentation (Pro+ plans)

---

## Feedback

We'd love to hear from you!

**Share Your Feedback**
- In-app feedback button
- Email: feedback@wazassist.ai
- Feature requests: ideas.wazassist.ai
- Bug reports: support@wazassist.ai

**Beta Testing**
Join our beta program to test new features first:
- Email: beta@wazassist.ai
- Subject: "Beta Tester Application"

---

Thank you for choosing WazAssist AI! We're excited to help you grow your business. 🚀

For questions or support, contact us at support@wazassist.ai
