# PPBE Management System - Backend API Documentation

## Overview

Production-grade TypeScript backend API for federal Planning, Programming, Budgeting, and Execution (PPBE) system with 25 comprehensive features.

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://api.ppbe.gov/api`

## Authentication

All protected endpoints require a JWT Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Authentication Flow (BE-002)

1. **Login**: `POST /auth/login`
2. **Refresh Token**: `POST /auth/refresh`
3. **Logout**: `POST /auth/logout`

## API Features

### BE-001: User Management API (CRUD with roles)

**Endpoints:**
- `POST /users` - Create user (Admin only)
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)
- `POST /users/change-password` - Change own password

**Roles:**
- `admin` - Full system access
- `budget_analyst` - Budget management
- `program_manager` - Program management
- `finance_officer` - Financial operations
- `approver` - Approval authority
- `viewer` - Read-only access
- `user` - Basic access

### BE-002: Authentication Service (JWT + refresh tokens)

**Endpoints:**
- `POST /auth/login` - Login with username/password
- `POST /auth/register` - Register new account
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (invalidate refresh token)
- `POST /auth/logout-all` - Logout from all devices

**Token Expiry:**
- Access Token: 1 hour
- Refresh Token: 7 days

### BE-003: Authorization Service (RBAC implementation)

Implemented as middleware throughout the API. Role-based access control protects all endpoints.

### BE-004: Budget Allocation API (complete CRUD)

**Endpoints:**
- `POST /budgets` - Create budget
- `GET /budgets` - List budgets (filterable by fiscalYear, department, status)
- `GET /budgets/:id` - Get budget details
- `PUT /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget
- `GET /budgets/fiscal-year/:fiscalYearId/summary` - Budget summary

### BE-005: Budget Line Item Management API

**Endpoints:**
- `POST /line-items` - Create line item
- `GET /line-items/budget/:budgetId` - Get line items for budget
- `GET /line-items/:id` - Get line item details
- `PUT /line-items/:id` - Update line item
- `DELETE /line-items/:id` - Delete line item
- `GET /line-items/budget/:budgetId/summary` - Line item summary

### BE-006: Fiscal Year Management API

**Endpoints:**
- `POST /fiscal-years` - Create fiscal year (Admin only)
- `GET /fiscal-years` - List all fiscal years
- `GET /fiscal-years/current` - Get current fiscal year
- `GET /fiscal-years/:id` - Get fiscal year details
- `PUT /fiscal-years/:id` - Update fiscal year
- `DELETE /fiscal-years/:id` - Delete fiscal year
- `POST /fiscal-years/:id/close` - Close fiscal year
- `POST /fiscal-years/:id/set-current` - Set as current fiscal year

### BE-007: Program Element Management API

**Endpoints:**
- `POST /programs` - Create program element
- `GET /programs` - List programs (filterable)
- `GET /programs/:id` - Get program details
- `PUT /programs/:id` - Update program
- `DELETE /programs/:id` - Delete program
- `GET /programs/fiscal-year/:fiscalYearId/summary` - Program summary

### BE-008: Organization Hierarchy API

**Endpoints:**
- `POST /organizations` - Create organization (Admin only)
- `GET /organizations` - List organizations
- `GET /organizations/:id` - Get organization details
- `PUT /organizations/:id` - Update organization
- `DELETE /organizations/:id` - Delete organization
- `GET /organizations/:id/children` - Get child organizations
- `GET /organizations/hierarchy/:rootId?` - Get organization tree

### BE-009 & BE-010: Approval Workflow Engine & Multi-level Routing

**Endpoints:**
- `POST /approvals/workflows` - Create workflow (Admin only)
- `GET /approvals/workflows` - List workflows
- `POST /approvals/requests` - Create approval request
- `GET /approvals/requests` - List approval requests
- `GET /approvals/pending` - Get pending approvals for current user
- `POST /approvals/requests/:id/process` - Approve/reject request
- `GET /approvals/history/:entityType/:entityId` - Get approval history

**Workflow Features:**
- Multi-step approval chains
- Role-based approvers
- Auto-approval thresholds
- Approval delegation

### BE-011: Audit Logging Service

**Endpoints:**
- `GET /audit/logs` - Get audit logs (Admin only)
- `GET /audit/trail/:entityType/:entityId` - Get entity audit trail
- `GET /audit/user/:userId` - Get user activity log

**Logged Actions:**
- CREATE, READ, UPDATE, DELETE
- LOGIN, LOGOUT
- APPROVE, REJECT
- IMPORT, EXPORT

### BE-012: Document Upload/Attachment Service

**Endpoints:**
- `POST /documents` - Upload document
- `GET /documents/:entityType/:entityId` - Get documents for entity
- `GET /documents/:id` - Get document details
- `DELETE /documents/:id` - Delete document
- `GET /documents/search` - Search documents

### BE-013 & BE-014: Report Generation & Export Service

**Endpoints:**
- `POST /reports/generate` - Generate report
- `GET /reports` - List reports
- `GET /reports/:id` - Get report details
- `DELETE /reports/:id` - Delete report
- `POST /reports/export` - Export data (CSV, JSON, Excel, PDF)

**Report Types:**
- Budget Summary
- Execution Analysis
- Variance Report
- Program Status
- Approval History
- Audit Log

### BE-015: Budget Version Control/History

**Endpoints:**
- `GET /budgets/:id/versions` - Get version history
- `POST /budgets/:id/rollback` - Rollback to specific version

**Features:**
- Automatic versioning on every update
- Full change tracking
- Version comparison
- Rollback capability

### BE-016: Comment/Collaboration Service

**Endpoints:**
- `POST /comments` - Create comment
- `GET /comments/:entityType/:entityId` - Get comments for entity
- `PUT /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment

**Features:**
- Threaded comments (replies)
- Edit history tracking
- User attribution

### BE-017: Notification Service

**Endpoints:**
- `POST /notifications` - Create notification (Admin only)
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread count
- `POST /notifications/:id/read` - Mark as read
- `POST /notifications/read-all` - Mark all as read

**Notification Types:**
- Approval requests
- Approval decisions
- Comment mentions
- Budget updates
- Threshold alerts
- System notifications

### BE-018: Search and Filtering Service

**Endpoints:**
- `POST /search/:collection` - Search collection with filters
- `POST /search/advanced` - Advanced multi-collection search

**Features:**
- Full-text search
- Field filtering
- Range queries
- Sorting
- Pagination

### BE-019: Obligation Tracking API

**Endpoints:**
- `POST /obligations` - Create obligation
- `GET /obligations` - List obligations (filterable)
- `GET /obligations/:id` - Get obligation details
- `PUT /obligations/:id` - Update obligation
- `DELETE /obligations/:id` - Delete obligation
- `GET /obligations/fiscal-year/:fiscalYearId/summary` - Obligation summary

### BE-020: Expenditure Tracking API

**Endpoints:**
- `POST /expenditures` - Create expenditure
- `GET /expenditures` - List expenditures (filterable)
- `GET /expenditures/:id` - Get expenditure details
- `PUT /expenditures/:id` - Update expenditure
- `DELETE /expenditures/:id` - Delete expenditure
- `GET /expenditures/fiscal-year/:fiscalYearId/summary` - Expenditure summary

### BE-021: Budget vs Actual Variance API

**Endpoints:**
- `POST /variance/calculate` - Calculate variance
- `GET /variance/budget/:budgetId` - Get budget variance analysis
- `GET /variance/fiscal-year/:fiscalYearId` - Get fiscal year variances
- `GET /variance/fiscal-year/:fiscalYearId/summary` - Variance summary

**Variance Status:**
- Favorable: < -10%
- Neutral: -10% to +10%
- Unfavorable: > +10%
- Critical: > +20%

### BE-022 & BE-023: Appropriation Validation & Fund Availability

**Endpoints:**
- `POST /appropriations` - Create appropriation
- `GET /appropriations` - List appropriations
- `GET /appropriations/:id` - Get appropriation details
- `PUT /appropriations/:id` - Update appropriation
- `DELETE /appropriations/:id` - Delete appropriation
- `POST /appropriations/check-availability` - Check fund availability
- `POST /appropriations/validate` - Validate appropriation

**Appropriation Types:**
- Annual
- Multi-year
- No-year

### BE-024 & BE-025: Bulk Import/Export & Data Validation

**Endpoints:**
- `POST /bulk/import` - Bulk import data
- `GET /bulk/export/:entityType` - Export data
- `POST /bulk/validate` - Validate bulk data

**Supported Entity Types:**
- budgets
- lineitems
- programs
- obligations
- expenditures

**Features:**
- CSV/JSON import
- Validation-only mode
- Error reporting
- Transaction rollback on failure

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error"
    }
  ]
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

- API Endpoints: 100 requests per 15 minutes per IP
- Authentication Endpoints: 5 requests per 15 minutes per IP

## Data Validation

All endpoints use Zod schemas for request validation. Invalid requests return detailed validation errors.

## Pagination

List endpoints support pagination via query parameters:

```
?page=1&limit=10&sort=createdAt&order=desc
```

## Security Features

1. **Helmet.js** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Rate Limiting** - DDoS protection
4. **JWT Authentication** - Secure token-based auth
5. **RBAC** - Role-based access control
6. **Audit Logging** - Complete activity tracking
7. **Input Validation** - Zod schema validation
8. **SQL Injection Prevention** - Parameterized queries
9. **XSS Protection** - Input sanitization

## Example Requests

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Create Budget
```bash
curl -X POST http://localhost:5000/api/budgets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fiscalYearId": "uuid",
    "title": "FY2025 Operations Budget",
    "amount": 1000000,
    "department": "Operations"
  }'
```

### Search
```bash
curl -X POST http://localhost:5000/api/search/budgets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "operations",
    "filters": {"department": "Operations"},
    "sort": {"field": "amount", "order": "desc"},
    "pagination": {"page": 1, "limit": 10}
  }'
```

## Default Credentials

- **Admin**: username=`admin`, password=`admin123`
- **Analyst**: username=`analyst`, password=`analyst123`
- **Manager**: username=`manager`, password=`manager123`

**IMPORTANT**: Change default passwords in production!

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet.js, bcryptjs, rate-limit
- **Data Storage**: In-memory (replace with database in production)

## Production Deployment

1. Set environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET` - Strong secret key
   - `JWT_REFRESH_SECRET` - Strong secret key
   - `PORT` - Server port
   - `CORS_ORIGIN` - Allowed origins

2. Replace in-memory storage with database (PostgreSQL recommended)
3. Configure file storage for documents
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)
6. Enable monitoring and logging

## Support

For API support, contact: support@ppbe.gov
