import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { seedService } from './services/seedService';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet for security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 authentication attempts
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================================================
// Body Parsing Middleware
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// Request Logging (Development)
// ============================================================================

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// API Routes
// ============================================================================

app.use('/api', routes);

// ============================================================================
// Error Handling
// ============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// Server Startup
// ============================================================================

const startServer = async () => {
  try {
    // Seed database with comprehensive data for all features
    await seedService.seedAllData();

    // Start the server
    app.listen(PORT, () => {
      console.log('===========================================');
      console.log(`PPBE Backend Server`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Port: ${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
      console.log('===========================================');
      console.log('\nAvailable API Endpoints:');
      console.log('------------------------');
      console.log('Authentication:     /api/auth/*');
      console.log('Users:              /api/users/*');
      console.log('Budgets:            /api/budgets/*');
      console.log('Line Items:         /api/line-items/*');
      console.log('Fiscal Years:       /api/fiscal-years/*');
      console.log('Programs:           /api/programs/*');
      console.log('Organizations:      /api/organizations/*');
      console.log('Approvals:          /api/approvals/*');
      console.log('Audit Logs:         /api/audit/*');
      console.log('Documents:          /api/documents/*');
      console.log('Reports:            /api/reports/*');
      console.log('Comments:           /api/comments/*');
      console.log('Notifications:      /api/notifications/*');
      console.log('Search:             /api/search/*');
      console.log('Obligations:        /api/obligations/*');
      console.log('Expenditures:       /api/expenditures/*');
      console.log('Variance:           /api/variance/*');
      console.log('Appropriations:     /api/appropriations/*');
      console.log('Bulk Operations:    /api/bulk/*');
      console.log('===========================================\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

export default app;
