import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/', apiLimiter);

// In-memory data stores (would be database in production)
const users = [];
const budgets = [];
const programs = [];
const executionRecords = [];
const fiscalYears = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Initialize with default admin user
const initializeDefaultUser = async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  users.push({
    id: uuidv4(),
    username: 'admin',
    password: hashedPassword,
    email: 'admin@ppbe.gov',
    role: 'admin',
    department: 'Administration',
    createdAt: new Date().toISOString()
  });
  console.log('Default admin user created - username: admin, password: admin123');
};

// Initialize default fiscal years
const initializeFiscalYears = () => {
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    fiscalYears.push({
      id: uuidv4(),
      year: currentYear + i,
      status: i === 0 ? 'current' : 'future',
      startDate: `${currentYear + i}-10-01`,
      endDate: `${currentYear + i + 1}-09-30`,
      totalBudget: 0,
      allocatedBudget: 0
    });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/register', authLimiter, [
  body('username').isLength({ min: 3 }),
  body('password').isLength({ min: 6 }),
  body('email').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, email, department, role } = req.body;

  // Check if user already exists
  if (users.find(u => u.username === username || u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    email,
    role: role || 'user',
    department: department || 'General',
    createdAt: new Date().toISOString()
  };

  users.push(user);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role }
  });
});

app.post('/api/auth/login', authLimiter, [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, department: user.department }
  });
});

// Budget Management Routes
app.get('/api/budgets', authenticateToken, (req, res) => {
  const { fiscalYear, department, status } = req.query;
  let filteredBudgets = [...budgets];

  if (fiscalYear) {
    filteredBudgets = filteredBudgets.filter(b => b.fiscalYear === fiscalYear);
  }
  if (department) {
    filteredBudgets = filteredBudgets.filter(b => b.department === department);
  }
  if (status) {
    filteredBudgets = filteredBudgets.filter(b => b.status === status);
  }

  res.json(filteredBudgets);
});

app.post('/api/budgets', authenticateToken, [
  body('title').notEmpty(),
  body('fiscalYear').notEmpty(),
  body('amount').isNumeric()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const budget = {
    id: uuidv4(),
    ...req.body,
    createdBy: req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: req.body.status || 'draft'
  };

  budgets.push(budget);
  res.status(201).json(budget);
});

app.get('/api/budgets/:id', authenticateToken, (req, res) => {
  const budget = budgets.find(b => b.id === req.params.id);
  if (!budget) {
    return res.status(404).json({ error: 'Budget not found' });
  }
  res.json(budget);
});

app.put('/api/budgets/:id', authenticateToken, (req, res) => {
  const index = budgets.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Budget not found' });
  }

  budgets[index] = {
    ...budgets[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json(budgets[index]);
});

app.delete('/api/budgets/:id', authenticateToken, (req, res) => {
  const index = budgets.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Budget not found' });
  }

  budgets.splice(index, 1);
  res.json({ message: 'Budget deleted successfully' });
});

// Program Management Routes
app.get('/api/programs', authenticateToken, (req, res) => {
  const { fiscalYear, status, department } = req.query;
  let filteredPrograms = [...programs];

  if (fiscalYear) {
    filteredPrograms = filteredPrograms.filter(p => p.fiscalYear === fiscalYear);
  }
  if (status) {
    filteredPrograms = filteredPrograms.filter(p => p.status === status);
  }
  if (department) {
    filteredPrograms = filteredPrograms.filter(p => p.department === department);
  }

  res.json(filteredPrograms);
});

app.post('/api/programs', authenticateToken, [
  body('name').notEmpty(),
  body('fiscalYear').notEmpty(),
  body('budget').isNumeric()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const program = {
    id: uuidv4(),
    ...req.body,
    createdBy: req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: req.body.status || 'planning'
  };

  programs.push(program);
  res.status(201).json(program);
});

app.get('/api/programs/:id', authenticateToken, (req, res) => {
  const program = programs.find(p => p.id === req.params.id);
  if (!program) {
    return res.status(404).json({ error: 'Program not found' });
  }
  res.json(program);
});

app.put('/api/programs/:id', authenticateToken, (req, res) => {
  const index = programs.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Program not found' });
  }

  programs[index] = {
    ...programs[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json(programs[index]);
});

app.delete('/api/programs/:id', authenticateToken, (req, res) => {
  const index = programs.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Program not found' });
  }

  programs.splice(index, 1);
  res.json({ message: 'Program deleted successfully' });
});

// Execution Tracking Routes
app.get('/api/execution', authenticateToken, (req, res) => {
  const { programId, fiscalYear, status } = req.query;
  let filteredRecords = [...executionRecords];

  if (programId) {
    filteredRecords = filteredRecords.filter(e => e.programId === programId);
  }
  if (fiscalYear) {
    filteredRecords = filteredRecords.filter(e => e.fiscalYear === fiscalYear);
  }
  if (status) {
    filteredRecords = filteredRecords.filter(e => e.status === status);
  }

  res.json(filteredRecords);
});

app.post('/api/execution', authenticateToken, [
  body('programId').notEmpty(),
  body('fiscalYear').notEmpty(),
  body('amountSpent').isNumeric()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const record = {
    id: uuidv4(),
    ...req.body,
    createdBy: req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  executionRecords.push(record);
  res.status(201).json(record);
});

app.get('/api/execution/:id', authenticateToken, (req, res) => {
  const record = executionRecords.find(e => e.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Execution record not found' });
  }
  res.json(record);
});

app.put('/api/execution/:id', authenticateToken, (req, res) => {
  const index = executionRecords.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Execution record not found' });
  }

  executionRecords[index] = {
    ...executionRecords[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json(executionRecords[index]);
});

// Fiscal Year Routes
app.get('/api/fiscal-years', authenticateToken, (req, res) => {
  res.json(fiscalYears);
});

// Dashboard/Analytics Routes
app.get('/api/dashboard/summary', authenticateToken, (req, res) => {
  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const totalPrograms = programs.length;
  const activePrograms = programs.filter(p => p.status === 'active').length;
  const totalExecuted = executionRecords.reduce((sum, e) => sum + parseFloat(e.amountSpent || 0), 0);

  res.json({
    totalBudget,
    totalPrograms,
    activePrograms,
    totalExecuted,
    budgetUtilization: totalBudget > 0 ? ((totalExecuted / totalBudget) * 100).toFixed(2) : 0,
    departments: [...new Set(programs.map(p => p.department))].length,
    pendingApprovals: budgets.filter(b => b.status === 'pending').length
  });
});

app.get('/api/dashboard/budget-by-department', authenticateToken, (req, res) => {
  const departmentBudgets = {};
  budgets.forEach(b => {
    if (!departmentBudgets[b.department]) {
      departmentBudgets[b.department] = 0;
    }
    departmentBudgets[b.department] += parseFloat(b.amount || 0);
  });

  const data = Object.entries(departmentBudgets).map(([department, amount]) => ({
    department,
    amount
  }));

  res.json(data);
});

app.get('/api/dashboard/execution-timeline', authenticateToken, (req, res) => {
  const timeline = executionRecords
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(e => ({
      date: e.createdAt,
      amount: e.amountSpent,
      programId: e.programId,
      description: e.description
    }));

  res.json(timeline);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
  await initializeDefaultUser();
  initializeFiscalYears();
  
  app.listen(PORT, () => {
    console.log(`PPBE Management Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
};

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
