// Test data fixtures
export const testUsers = {
  admin: {
    username: 'testadmin',
    password: 'testpass123',
    email: 'testadmin@ppbe.gov',
    role: 'admin',
    department: 'Administration'
  },
  user: {
    username: 'testuser',
    password: 'userpass123',
    email: 'testuser@ppbe.gov',
    role: 'user',
    department: 'Finance'
  }
};

export const testBudget = {
  title: 'Test Budget FY2025',
  fiscalYear: '2025',
  amount: 1000000,
  department: 'Defense',
  description: 'Test budget description',
  status: 'draft'
};

export const testProgram = {
  name: 'Test Program',
  fiscalYear: '2025',
  budget: 500000,
  department: 'Defense',
  description: 'Test program description',
  status: 'planning'
};

export const testExecutionRecord = {
  programId: 'test-program-id',
  fiscalYear: '2025',
  amountSpent: 250000,
  description: 'Test execution record',
  status: 'in-progress'
};
