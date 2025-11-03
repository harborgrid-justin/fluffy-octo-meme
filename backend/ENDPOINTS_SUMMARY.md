# PPBE Backend API - Complete Endpoint Reference

## Quick Reference - All 25 Features

### BE-001: User Management (CRUD with roles)
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/users` | Create user | Yes | Admin |
| GET | `/api/users` | List all users | Yes | Admin, Analyst |
| GET | `/api/users/:id` | Get user by ID | Yes | Any |
| PUT | `/api/users/:id` | Update user | Yes | Admin |
| DELETE | `/api/users/:id` | Delete user | Yes | Admin |
| POST | `/api/users/change-password` | Change password | Yes | Any |

### BE-002: Authentication (JWT + Refresh Tokens)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/register` | Register | No |
| POST | `/api/auth/refresh` | Refresh token | No |
| POST | `/api/auth/logout` | Logout | Yes |
| POST | `/api/auth/logout-all` | Logout all devices | Yes |

### BE-004: Budget Allocation (Complete CRUD)
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/budgets` | Create budget | Yes | Admin, Analyst |
| GET | `/api/budgets` | List budgets | Yes | Any |
| GET | `/api/budgets/:id` | Get budget | Yes | Any |
| PUT | `/api/budgets/:id` | Update budget | Yes | Admin, Analyst |
| DELETE | `/api/budgets/:id` | Delete budget | Yes | Admin |
| GET | `/api/budgets/fiscal-year/:fiscalYearId/summary` | Budget summary | Yes | Any |

### BE-005: Budget Line Items
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/line-items` | Create line item | Yes | Admin, Analyst |
| GET | `/api/line-items/budget/:budgetId` | Get by budget | Yes | Any |
| GET | `/api/line-items/:id` | Get line item | Yes | Any |
| PUT | `/api/line-items/:id` | Update line item | Yes | Admin, Analyst |
| DELETE | `/api/line-items/:id` | Delete line item | Yes | Admin |
| GET | `/api/line-items/budget/:budgetId/summary` | Line item summary | Yes | Any |

### BE-006: Fiscal Year Management
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/fiscal-years` | Create fiscal year | Yes | Admin |
| GET | `/api/fiscal-years` | List fiscal years | Yes | Any |
| GET | `/api/fiscal-years/current` | Get current FY | Yes | Any |
| GET | `/api/fiscal-years/:id` | Get fiscal year | Yes | Any |
| PUT | `/api/fiscal-years/:id` | Update fiscal year | Yes | Admin |
| DELETE | `/api/fiscal-years/:id` | Delete fiscal year | Yes | Admin |
| POST | `/api/fiscal-years/:id/close` | Close fiscal year | Yes | Admin |
| POST | `/api/fiscal-years/:id/set-current` | Set as current | Yes | Admin |

### BE-007: Program Elements
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/programs` | Create program | Yes | Admin, Manager |
| GET | `/api/programs` | List programs | Yes | Any |
| GET | `/api/programs/:id` | Get program | Yes | Any |
| PUT | `/api/programs/:id` | Update program | Yes | Admin, Manager |
| DELETE | `/api/programs/:id` | Delete program | Yes | Admin |
| GET | `/api/programs/fiscal-year/:fiscalYearId/summary` | Program summary | Yes | Any |

### BE-008: Organization Hierarchy
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/organizations` | Create org | Yes | Admin |
| GET | `/api/organizations` | List orgs | Yes | Any |
| GET | `/api/organizations/:id` | Get org | Yes | Any |
| PUT | `/api/organizations/:id` | Update org | Yes | Admin |
| DELETE | `/api/organizations/:id` | Delete org | Yes | Admin |
| GET | `/api/organizations/:id/children` | Get children | Yes | Any |
| GET | `/api/organizations/hierarchy/:rootId?` | Get hierarchy | Yes | Any |

### BE-009 & BE-010: Approval Workflows
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/approvals/workflows` | Create workflow | Yes | Admin |
| GET | `/api/approvals/workflows` | List workflows | Yes | Any |
| POST | `/api/approvals/requests` | Create request | Yes | Any |
| GET | `/api/approvals/requests` | List requests | Yes | Any |
| GET | `/api/approvals/pending` | Get pending | Yes | Any |
| POST | `/api/approvals/requests/:id/process` | Process approval | Yes | Approver, Admin |
| GET | `/api/approvals/history/:entityType/:entityId` | Get history | Yes | Any |

### BE-011: Audit Logging
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/audit/logs` | Get audit logs | Yes | Admin, Finance |
| GET | `/api/audit/trail/:entityType/:entityId` | Get entity trail | Yes | Any |
| GET | `/api/audit/user/:userId` | Get user activity | Yes | Admin |

### BE-012: Document Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/documents` | Upload document | Yes |
| GET | `/api/documents/:entityType/:entityId` | Get by entity | Yes |
| GET | `/api/documents/:id` | Get document | Yes |
| DELETE | `/api/documents/:id` | Delete document | Yes |
| GET | `/api/documents/search` | Search documents | Yes |

### BE-013 & BE-014: Reports & Export
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/reports/generate` | Generate report | Yes |
| GET | `/api/reports` | List reports | Yes |
| GET | `/api/reports/:id` | Get report | Yes |
| DELETE | `/api/reports/:id` | Delete report | Yes |
| POST | `/api/reports/export` | Export data | Yes |

### BE-015: Budget Version Control
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/budgets/:id/versions` | Get version history | Yes |
| POST | `/api/budgets/:id/rollback` | Rollback version | Yes |

### BE-016: Comments/Collaboration
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/comments` | Create comment | Yes |
| GET | `/api/comments/:entityType/:entityId` | Get comments | Yes |
| PUT | `/api/comments/:id` | Update comment | Yes |
| DELETE | `/api/comments/:id` | Delete comment | Yes |

### BE-017: Notifications
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/notifications` | Create notification | Yes | Admin |
| GET | `/api/notifications` | Get user notifications | Yes | Any |
| GET | `/api/notifications/unread-count` | Get unread count | Yes | Any |
| POST | `/api/notifications/:id/read` | Mark as read | Yes | Any |
| POST | `/api/notifications/read-all` | Mark all as read | Yes | Any |

### BE-018: Search & Filtering
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/search/:collection` | Search collection | Yes |
| POST | `/api/search/advanced` | Advanced search | Yes |

### BE-019: Obligation Tracking
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/obligations` | Create obligation | Yes | Admin, Finance |
| GET | `/api/obligations` | List obligations | Yes | Any |
| GET | `/api/obligations/:id` | Get obligation | Yes | Any |
| PUT | `/api/obligations/:id` | Update obligation | Yes | Admin, Finance |
| DELETE | `/api/obligations/:id` | Delete obligation | Yes | Admin |
| GET | `/api/obligations/fiscal-year/:fiscalYearId/summary` | Obligation summary | Yes | Any |

### BE-020: Expenditure Tracking
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/expenditures` | Create expenditure | Yes | Admin, Finance |
| GET | `/api/expenditures` | List expenditures | Yes | Any |
| GET | `/api/expenditures/:id` | Get expenditure | Yes | Any |
| PUT | `/api/expenditures/:id` | Update expenditure | Yes | Admin, Finance |
| DELETE | `/api/expenditures/:id` | Delete expenditure | Yes | Admin |
| GET | `/api/expenditures/fiscal-year/:fiscalYearId/summary` | Expenditure summary | Yes | Any |

### BE-021: Variance Analysis
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/variance/calculate` | Calculate variance | Yes |
| GET | `/api/variance/budget/:budgetId` | Get budget variance | Yes |
| GET | `/api/variance/fiscal-year/:fiscalYearId` | Get FY variances | Yes |
| GET | `/api/variance/fiscal-year/:fiscalYearId/summary` | Variance summary | Yes |

### BE-022 & BE-023: Appropriations & Fund Availability
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/appropriations` | Create appropriation | Yes | Admin, Finance |
| GET | `/api/appropriations` | List appropriations | Yes | Any |
| GET | `/api/appropriations/:id` | Get appropriation | Yes | Any |
| PUT | `/api/appropriations/:id` | Update appropriation | Yes | Admin, Finance |
| DELETE | `/api/appropriations/:id` | Delete appropriation | Yes | Admin |
| POST | `/api/appropriations/check-availability` | Check availability | Yes | Any |
| POST | `/api/appropriations/validate` | Validate appropriation | Yes | Any |

### BE-024 & BE-025: Bulk Operations & Validation
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/bulk/import` | Bulk import | Yes | Admin, Analyst |
| GET | `/api/bulk/export/:entityType` | Export data | Yes | Any |
| POST | `/api/bulk/validate` | Validate data | Yes | Any |

## System Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |

## Total Endpoint Count

- **Authentication**: 5 endpoints
- **Users**: 6 endpoints
- **Budgets**: 8 endpoints (including versions)
- **Line Items**: 6 endpoints
- **Fiscal Years**: 8 endpoints
- **Programs**: 6 endpoints
- **Organizations**: 7 endpoints
- **Approvals**: 7 endpoints
- **Audit**: 3 endpoints
- **Documents**: 5 endpoints
- **Reports**: 5 endpoints
- **Comments**: 4 endpoints
- **Notifications**: 5 endpoints
- **Search**: 2 endpoints
- **Obligations**: 6 endpoints
- **Expenditures**: 6 endpoints
- **Variance**: 4 endpoints
- **Appropriations**: 7 endpoints
- **Bulk Operations**: 3 endpoints
- **System**: 1 endpoint

**Total: 104 API endpoints** implementing 25 production features

## Common Query Parameters

### Pagination
```
?page=1&limit=10
```

### Sorting
```
?sort=createdAt&order=desc
```

### Filtering (varies by endpoint)
```
?fiscalYearId=uuid&department=Operations&status=active
```

## Common Request Headers

```
Content-Type: application/json
Authorization: Bearer <access_token>
```

## Common Response Format

### Success
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field error"
    }
  ]
}
```

## User Roles

- `admin` - Full system access
- `budget_analyst` - Budget management
- `program_manager` - Program management
- `finance_officer` - Financial operations
- `approver` - Approval authority
- `viewer` - Read-only access
- `user` - Basic access
