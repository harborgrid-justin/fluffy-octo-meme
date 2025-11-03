# Federal PPBE Management System

A production-ready US federal government Planning, Programming, Budgeting, and Execution (PPBE) management and administration system with full GUI.

## Overview

This comprehensive application provides federal agencies with a complete solution for managing the PPBE cycle, including:

- **Planning**: Define strategic objectives and program initiatives
- **Programming**: Allocate resources and prioritize programs
- **Budgeting**: Create, track, and manage budget allocations
- **Execution**: Monitor spending and track program execution

## Features

### Backend (Node.js/Express)
- RESTful API with comprehensive PPBE endpoints
- JWT-based authentication and authorization
- Secure password hashing with bcrypt
- Input validation and sanitization
- CORS and Helmet security middleware
- Role-based access control
- In-memory data storage (easily adaptable to database)

### Frontend (React)
- Modern, responsive UI design following US Web Design System principles
- Dashboard with real-time metrics and analytics
- Budget management interface
- Program planning and tracking
- Execution monitoring and reporting
- Intuitive data filtering and search
- Modal-based forms for data entry
- Professional color scheme and styling

## Technology Stack

**Backend:**
- Node.js
- Express.js
- JSON Web Tokens (JWT)
- bcryptjs for password hashing
- Helmet for security headers
- express-validator for input validation

**Frontend:**
- React 19
- React Router for navigation
- Axios for API calls
- Vite for fast development and building
- Modern CSS with custom properties

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fluffy-octo-meme
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

#### Start the Backend Server

```bash
cd backend
npm start
```

The backend server will start on `http://localhost:5000`

#### Start the Frontend Application

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### Default Login Credentials

- **Username:** admin
- **Password:** admin123

**⚠️ IMPORTANT:** Change these credentials in a production environment!

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with username and password
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### POST /api/auth/register
Register a new user
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.gov",
  "department": "Defense",
  "role": "user"
}
```

### Budget Management Endpoints

- `GET /api/budgets` - Get all budgets (with optional filters)
- `POST /api/budgets` - Create a new budget
- `GET /api/budgets/:id` - Get a specific budget
- `PUT /api/budgets/:id` - Update a budget
- `DELETE /api/budgets/:id` - Delete a budget

### Program Management Endpoints

- `GET /api/programs` - Get all programs (with optional filters)
- `POST /api/programs` - Create a new program
- `GET /api/programs/:id` - Get a specific program
- `PUT /api/programs/:id` - Update a program
- `DELETE /api/programs/:id` - Delete a program

### Execution Tracking Endpoints

- `GET /api/execution` - Get all execution records (with optional filters)
- `POST /api/execution` - Create a new execution record
- `GET /api/execution/:id` - Get a specific execution record
- `PUT /api/execution/:id` - Update an execution record

### Dashboard Endpoints

- `GET /api/dashboard/summary` - Get dashboard summary statistics
- `GET /api/dashboard/budget-by-department` - Get budget breakdown by department
- `GET /api/dashboard/execution-timeline` - Get execution timeline data

### Fiscal Year Endpoints

- `GET /api/fiscal-years` - Get all fiscal years

All endpoints (except auth endpoints) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Security Features

### Production Considerations

1. **Environment Variables**: Use `.env` files to manage sensitive configuration
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with production values
   ```

2. **JWT Secret**: Change the JWT_SECRET in production to a strong, random value

3. **HTTPS**: Deploy behind a reverse proxy (nginx/Apache) with SSL/TLS

4. **Database**: Replace in-memory storage with a production database (PostgreSQL, MongoDB)

5. **Input Validation**: All inputs are validated using express-validator

6. **Password Security**: Passwords are hashed using bcryptjs before storage

7. **CORS**: Configure CORS to only allow requests from trusted domains

8. **Helmet**: Security headers are automatically applied

## Project Structure

```
fluffy-octo-meme/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Header.jsx
│   │   │   └── Navigation.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Budgets.jsx
│   │   │   ├── Programs.jsx
│   │   │   └── Execution.jsx
│   │   ├── services/         # API services
│   │   │   └── api.js
│   │   ├── App.jsx           # Main App component
│   │   ├── main.jsx          # Entry point
│   │   └── styles.css        # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

## User Guide

### Dashboard
The dashboard provides an at-a-glance view of:
- Total budget across all programs
- Number of active programs
- Budget execution percentage
- Pending approvals
- Budget breakdown by department

### Budget Management
Create and manage budget allocations:
1. Click "New Budget" to create a budget entry
2. Fill in required fields (title, fiscal year, department, amount)
3. Set budget category and status
4. Use filters to find specific budgets

### Program Planning
Define and track federal programs:
1. Click "New Program" to create a program
2. Enter program details including budget allocation
3. Set priority level and status
4. Track program objectives and milestones

### Execution Tracking
Monitor program spending and execution:
1. Click "New Record" to log execution activity
2. Link record to a specific program
3. Enter amount spent and execution date
4. Update status (on-track, at-risk, delayed, completed)

## Deployment

### Backend Deployment

1. Set environment variables for production
2. Build and deploy to your server or cloud platform
3. Ensure Node.js is installed on the server
4. Run with process manager (PM2, systemd)

```bash
# Example with PM2
npm install -g pm2
pm2 start server.js --name ppbe-backend
```

### Frontend Deployment

1. Build the production bundle:
```bash
cd frontend
npm run build
```

2. Deploy the `dist` folder to your web server or CDN
3. Configure web server to serve `index.html` for all routes (SPA routing)

### Recommended Deployment Platforms
- AWS (EC2, Elastic Beanstalk, S3 + CloudFront)
- Azure App Service
- Google Cloud Platform
- Heroku
- DigitalOcean

## Support and Maintenance

### Troubleshooting

**Backend won't start:**
- Check that port 5000 is available
- Verify all dependencies are installed
- Check Node.js version

**Frontend can't connect to backend:**
- Ensure backend is running
- Check API URL in `frontend/src/services/api.js`
- Verify CORS settings

**Login fails:**
- Verify default credentials (admin/admin123)
- Check JWT_SECRET is set
- Check browser console for errors

## Contributing

This is a production-ready federal government application. Any modifications should:
1. Maintain security standards
2. Follow existing code patterns
3. Include appropriate documentation
4. Pass security reviews

## License

ISC

## Compliance

This system is designed with federal government requirements in mind:
- Security best practices
- Role-based access control
- Audit trails (via createdBy/updatedAt fields)
- Input validation
- Secure authentication

**Note:** Before deploying in a federal environment, ensure compliance with:
- FISMA (Federal Information Security Management Act)
- NIST security standards
- Agency-specific security requirements
- FedRAMP authorization (if cloud-hosted)