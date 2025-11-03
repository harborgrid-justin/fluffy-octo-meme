import { userService } from './userService';
import { fiscalYearService } from './fiscalYearService';
import { organizationService } from './organizationService';
import { budgetService } from './budgetService';
import { lineItemService } from './lineItemService';
import { programElementService } from './programElementService';
import { appropriationService } from './appropriationService';
import { obligationService } from './obligationService';
import { expenditureService } from './expenditureService';
import { approvalService } from './approvalService';
import { commentService } from './commentService';
import { notificationService } from './notificationService';
import { documentService } from './documentService';
import { auditService } from './auditService';
import { reportService } from './reportService';
import { varianceService } from './varianceService';
import { dataStore } from './dataStore';
import {
  UserRole, FiscalYearStatus, OrganizationType, BudgetStatus,
  ApprovalStatus, ProgramStatus, AppropriationType, ObligationStatus,
  ExpenditureStatus, NotificationType, NotificationPriority,
  ReportType, ReportFormat, ReportStatus, VarianceStatus,
  ApprovalEntityType, AuditAction, ApprovalActionType
} from '../types';

export class SeedService {
  private userIds: { [key: string]: string } = {};
  private organizationIds: { [key: string]: string } = {};
  private fiscalYearIds: { [key: string]: string } = {};
  private budgetIds: string[] = [];
  private programIds: string[] = [];
  private appropriationIds: string[] = [];

  async seedAllData(): Promise<void> {
    try {
      console.log('\n🌱 Starting comprehensive database seeding...\n');

      // Clear existing data
      dataStore.clear();
      console.log('✓ Cleared existing data');

      // Seed in order of dependencies
      await this.seedUsers();
      await this.seedOrganizations();
      await this.seedFiscalYears();
      await this.seedAppropriations();
      await this.seedProgramElements();
      await this.seedBudgets();
      await this.seedBudgetLineItems();
      await this.seedObligations();
      await this.seedExpenditures();
      await this.seedApprovalWorkflows();
      await this.seedApprovalRequests();
      await this.seedComments();
      await this.seedNotifications();
      await this.seedDocuments();
      await this.seedReports();
      await this.seedVarianceAnalyses();
      await this.seedAuditLogs();

      console.log('\n===========================================');
      console.log('🎉 Database seeded successfully!');
      console.log('===========================================');
      this.printSummary();
      console.log('===========================================\n');

    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  private async seedUsers(): Promise<void> {
    const users = [
      {
        username: 'admin',
        password: 'admin123',
        email: 'admin@ppbe.gov',
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        department: 'Administration'
      },
      {
        username: 'analyst1',
        password: 'analyst123',
        email: 'analyst1@ppbe.gov',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: UserRole.BUDGET_ANALYST,
        department: 'Budget Office'
      },
      {
        username: 'analyst2',
        password: 'analyst123',
        email: 'analyst2@ppbe.gov',
        firstName: 'Michael',
        lastName: 'Chen',
        role: UserRole.BUDGET_ANALYST,
        department: 'Budget Office'
      },
      {
        username: 'manager1',
        password: 'manager123',
        email: 'manager1@ppbe.gov',
        firstName: 'Jennifer',
        lastName: 'Martinez',
        role: UserRole.PROGRAM_MANAGER,
        department: 'Program Office'
      },
      {
        username: 'manager2',
        password: 'manager123',
        email: 'manager2@ppbe.gov',
        firstName: 'David',
        lastName: 'Thompson',
        role: UserRole.PROGRAM_MANAGER,
        department: 'Program Office'
      },
      {
        username: 'finance1',
        password: 'finance123',
        email: 'finance1@ppbe.gov',
        firstName: 'Robert',
        lastName: 'Williams',
        role: UserRole.FINANCE_OFFICER,
        department: 'Finance Office'
      },
      {
        username: 'approver1',
        password: 'approver123',
        email: 'approver1@ppbe.gov',
        firstName: 'Patricia',
        lastName: 'Davis',
        role: UserRole.APPROVER,
        department: 'Executive Office'
      },
      {
        username: 'approver2',
        password: 'approver123',
        email: 'approver2@ppbe.gov',
        firstName: 'James',
        lastName: 'Anderson',
        role: UserRole.APPROVER,
        department: 'Executive Office'
      },
      {
        username: 'viewer1',
        password: 'viewer123',
        email: 'viewer1@ppbe.gov',
        firstName: 'Linda',
        lastName: 'Wilson',
        role: UserRole.VIEWER,
        department: 'Audit Office'
      }
    ];

    for (const userData of users) {
      const user = await userService.createUser(userData);
      this.userIds[userData.username] = user.id;
    }

    console.log(`✓ Created ${users.length} users`);
  }

  private async seedOrganizations(): Promise<void> {
    // Root organization
    const dod = await organizationService.createOrganization({
      name: 'Department of Defense',
      code: 'DOD',
      type: OrganizationType.DEPARTMENT,
      description: 'Department of Defense - Root Organization'
    });
    this.organizationIds['dod'] = dod.id;

    // Service branches
    const army = await organizationService.createOrganization({
      name: 'Department of the Army',
      code: 'DA',
      type: OrganizationType.DEPARTMENT,
      parentId: dod.id,
      description: 'United States Army'
    });
    this.organizationIds['army'] = army.id;

    const navy = await organizationService.createOrganization({
      name: 'Department of the Navy',
      code: 'DN',
      type: OrganizationType.DEPARTMENT,
      parentId: dod.id,
      description: 'United States Navy and Marine Corps'
    });
    this.organizationIds['navy'] = navy.id;

    const airforce = await organizationService.createOrganization({
      name: 'Department of the Air Force',
      code: 'DAF',
      type: OrganizationType.DEPARTMENT,
      parentId: dod.id,
      description: 'United States Air Force and Space Force'
    });
    this.organizationIds['airforce'] = airforce.id;

    // Army sub-organizations
    const armyBudget = await organizationService.createOrganization({
      name: 'Army Budget Office',
      code: 'ABO',
      type: OrganizationType.OFFICE,
      parentId: army.id,
      description: 'Manages Army budget planning and execution'
    });
    this.organizationIds['armyBudget'] = armyBudget.id;

    await organizationService.createOrganization({
      name: 'Army Acquisition Division',
      code: 'AAD',
      type: OrganizationType.DIVISION,
      parentId: army.id,
      description: 'Manages Army acquisition programs'
    });

    await organizationService.createOrganization({
      name: 'Army Operations Division',
      code: 'AOD',
      type: OrganizationType.DIVISION,
      parentId: army.id,
      description: 'Manages Army operations'
    });

    // Navy sub-organizations
    await organizationService.createOrganization({
      name: 'Navy Budget Office',
      code: 'NBO',
      type: OrganizationType.OFFICE,
      parentId: navy.id,
      description: 'Manages Navy budget planning and execution'
    });

    await organizationService.createOrganization({
      name: 'Naval Aviation Division',
      code: 'NAD',
      type: OrganizationType.DIVISION,
      parentId: navy.id,
      description: 'Naval aviation programs'
    });

    // Air Force sub-organizations
    await organizationService.createOrganization({
      name: 'Air Force Budget Office',
      code: 'AFBO',
      type: OrganizationType.OFFICE,
      parentId: airforce.id,
      description: 'Manages Air Force budget planning and execution'
    });

    console.log('✓ Created organization hierarchy (10 organizations)');
  }

  private async seedFiscalYears(): Promise<void> {
    const currentYear = new Date().getFullYear();

    for (let i = -1; i <= 3; i++) {
      const year = currentYear + i;
      const fy = await fiscalYearService.createFiscalYear({
        year,
        name: `FY ${year}`,
        status: i === 0 ? FiscalYearStatus.CURRENT : i < 0 ? FiscalYearStatus.CLOSED : FiscalYearStatus.FUTURE,
        startDate: new Date(year - 1, 9, 1), // October 1
        endDate: new Date(year, 8, 30), // September 30
        totalBudget: 1000000000 + (i * 50000000), // Varying budgets
      });
      this.fiscalYearIds[`fy${year}`] = fy.id;
    }

    console.log('✓ Created 5 fiscal years (past, current, and future)');
  }

  private async seedAppropriations(): Promise<void> {
    const currentFyId = this.fiscalYearIds[`fy${new Date().getFullYear()}`];
    const appropriations = [
      {
        code: 'OM-ARMY-2025',
        name: 'Operation and Maintenance, Army',
        amount: 350000000,
        type: AppropriationType.ANNUAL,
        expirationDate: new Date(new Date().getFullYear(), 8, 30)
      },
      {
        code: 'MILPERS-ARMY-2025',
        name: 'Military Personnel, Army',
        amount: 200000000,
        type: AppropriationType.ANNUAL,
        expirationDate: new Date(new Date().getFullYear(), 8, 30)
      },
      {
        code: 'RDTNE-2025',
        name: 'Research, Development, Test & Evaluation, Army',
        amount: 150000000,
        type: AppropriationType.MULTI_YEAR,
        expirationDate: new Date(new Date().getFullYear() + 2, 8, 30)
      },
      {
        code: 'PROCUREMENT-ARMY-2025',
        name: 'Procurement, Army',
        amount: 300000000,
        type: AppropriationType.MULTI_YEAR,
        expirationDate: new Date(new Date().getFullYear() + 3, 8, 30)
      }
    ];

    for (const appData of appropriations) {
      const app = await appropriationService.createAppropriation({
        fiscalYearId: currentFyId,
        ...appData,
        allocatedAmount: 0,
        availableAmount: appData.amount,
        restrictions: ['Must comply with 31 U.S.C.', 'Subject to Anti-Deficiency Act']
      });
      this.appropriationIds.push(app.id);
    }

    console.log('✓ Created 4 appropriations');
  }

  private async seedProgramElements(): Promise<void> {
    const currentFyId = this.fiscalYearIds[`fy${new Date().getFullYear()}`];
    const programs = [
      {
        peNumber: 'PE-0101101A',
        name: 'Army Modernization',
        description: 'Army modernization and capability development programs',
        department: 'Army',
        budget: 75000000,
        status: ProgramStatus.EXECUTION,
        priority: 1,
        milestones: [
          { id: 'm1', name: 'Initial Planning Complete', dueDate: new Date(2025, 2, 1), status: 'completed', completedAt: new Date(2025, 1, 15) },
          { id: 'm2', name: 'Requirements Review', dueDate: new Date(2025, 5, 1), status: 'in_progress' },
          { id: 'm3', name: 'Acquisition Phase Start', dueDate: new Date(2025, 8, 1), status: 'pending' }
        ]
      },
      {
        peNumber: 'PE-0204785A',
        name: 'Combat Vehicle Upgrade',
        description: 'Upgrade and sustainment of combat vehicles',
        department: 'Army',
        budget: 125000000,
        status: ProgramStatus.EXECUTION,
        priority: 2,
        milestones: [
          { id: 'm4', name: 'Design Phase', dueDate: new Date(2025, 3, 1), status: 'completed', completedAt: new Date(2025, 2, 20) },
          { id: 'm5', name: 'Prototype Testing', dueDate: new Date(2025, 7, 1), status: 'in_progress' }
        ]
      },
      {
        peNumber: 'PE-0301141N',
        name: 'Naval Aviation Modernization',
        description: 'Modernization of naval aviation capabilities',
        department: 'Navy',
        budget: 95000000,
        status: ProgramStatus.BUDGETING,
        priority: 1,
        milestones: [
          { id: 'm6', name: 'Budget Justification', dueDate: new Date(2025, 4, 1), status: 'in_progress' }
        ]
      },
      {
        peNumber: 'PE-0605018F',
        name: 'Advanced Aerospace Systems',
        description: 'Development of advanced aerospace technologies',
        department: 'Air Force',
        budget: 180000000,
        status: ProgramStatus.PROGRAMMING,
        priority: 1,
        milestones: [
          { id: 'm7', name: 'Technology Demonstration', dueDate: new Date(2025, 6, 1), status: 'pending' }
        ]
      },
      {
        peNumber: 'PE-0401119A',
        name: 'Cyber Defense Initiative',
        description: 'Cybersecurity and defense capabilities',
        department: 'Army',
        budget: 45000000,
        status: ProgramStatus.EXECUTION,
        priority: 3,
        milestones: []
      }
    ];

    for (const progData of programs) {
      const prog = await programElementService.createProgramElement({
        ...progData,
        fiscalYearId: currentFyId,
        organizationId: this.organizationIds['army'],
        startDate: new Date(2024, 9, 1),
        obligatedAmount: Math.floor(progData.budget * 0.6),
        expendedAmount: Math.floor(progData.budget * 0.4),
        createdBy: this.userIds['manager1']
      });
      this.programIds.push(prog.id);
    }

    console.log('✓ Created 5 program elements with milestones');
  }

  private async seedBudgets(): Promise<void> {
    const currentFyId = this.fiscalYearIds[`fy${new Date().getFullYear()}`];
    const budgets = [
      {
        fiscalYearId: currentFyId,
        title: 'FY 2025 Army Operations Budget',
        description: 'Annual operations and maintenance budget for Army units',
        amount: 85000000,
        allocatedAmount: 82000000,
        obligatedAmount: 65000000,
        expendedAmount: 48000000,
        department: 'Army',
        organizationId: this.organizationIds['army'],
        status: BudgetStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        version: 3,
        createdBy: this.userIds['analyst1']
      },
      {
        fiscalYearId: currentFyId,
        title: 'FY 2025 Personnel Compensation',
        description: 'Military personnel salaries and benefits',
        amount: 65000000,
        allocatedAmount: 65000000,
        obligatedAmount: 45000000,
        expendedAmount: 38000000,
        department: 'Army',
        organizationId: this.organizationIds['army'],
        status: BudgetStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        version: 2,
        createdBy: this.userIds['analyst1']
      },
      {
        fiscalYearId: currentFyId,
        title: 'FY 2025 Research & Development',
        description: 'Research and development programs for new capabilities',
        amount: 42000000,
        allocatedAmount: 38000000,
        obligatedAmount: 25000000,
        expendedAmount: 18000000,
        department: 'Army',
        organizationId: this.organizationIds['army'],
        status: BudgetStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        version: 1,
        createdBy: this.userIds['analyst2']
      },
      {
        fiscalYearId: currentFyId,
        title: 'FY 2025 Navy Aviation Budget',
        description: 'Naval aviation operations and maintenance',
        amount: 72000000,
        allocatedAmount: 68000000,
        obligatedAmount: 52000000,
        expendedAmount: 42000000,
        department: 'Navy',
        organizationId: this.organizationIds['navy'],
        status: BudgetStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        version: 2,
        createdBy: this.userIds['analyst2']
      },
      {
        fiscalYearId: currentFyId,
        title: 'Q2 2025 Procurement Request',
        description: 'Quarterly procurement budget for equipment and supplies',
        amount: 28000000,
        allocatedAmount: 12000000,
        obligatedAmount: 0,
        expendedAmount: 0,
        department: 'Army',
        organizationId: this.organizationIds['army'],
        status: BudgetStatus.SUBMITTED,
        approvalStatus: ApprovalStatus.IN_REVIEW,
        version: 1,
        createdBy: this.userIds['analyst1']
      },
      {
        fiscalYearId: currentFyId,
        title: 'FY 2025 Training & Readiness',
        description: 'Training programs and readiness initiatives',
        amount: 35000000,
        allocatedAmount: 32000000,
        obligatedAmount: 28000000,
        expendedAmount: 22000000,
        department: 'Army',
        organizationId: this.organizationIds['army'],
        status: BudgetStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        version: 2,
        createdBy: this.userIds['analyst2']
      },
      {
        fiscalYearId: currentFyId,
        title: 'FY 2025 Facilities Maintenance',
        description: 'Base facilities maintenance and improvements',
        amount: 18000000,
        allocatedAmount: 15000000,
        obligatedAmount: 8000000,
        expendedAmount: 5000000,
        department: 'Army',
        organizationId: this.organizationIds['armyBudget'],
        status: BudgetStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        version: 1,
        createdBy: this.userIds['analyst1']
      },
      {
        fiscalYearId: currentFyId,
        title: 'Contingency Operations Fund',
        description: 'Emergency contingency operations budget',
        amount: 50000000,
        allocatedAmount: 0,
        obligatedAmount: 0,
        expendedAmount: 0,
        department: 'Army',
        organizationId: this.organizationIds['army'],
        status: BudgetStatus.DRAFT,
        approvalStatus: ApprovalStatus.PENDING,
        version: 1,
        createdBy: this.userIds['manager1']
      }
    ];

    for (const budgetData of budgets) {
      const budget = await budgetService.createBudget(budgetData);
      this.budgetIds.push(budget.id);
    }

    console.log('✓ Created 8 budgets with various statuses');
  }

  private async seedBudgetLineItems(): Promise<void> {
    // Create line items for each budget
    const lineItemsPerBudget = [
      // Budget 1: Army Operations
      [
        { lineNumber: '1001', description: 'Personnel Salaries', amount: 25000000, appropriation: 'MILPERS-ARMY-2025', category: 'Personnel', obligatedAmount: 22000000, expendedAmount: 18000000 },
        { lineNumber: '1002', description: 'Equipment Maintenance', amount: 18000000, appropriation: 'OM-ARMY-2025', category: 'Maintenance', obligatedAmount: 15000000, expendedAmount: 12000000 },
        { lineNumber: '1003', description: 'Transportation', amount: 12000000, appropriation: 'OM-ARMY-2025', category: 'Operations', obligatedAmount: 10000000, expendedAmount: 8000000 },
        { lineNumber: '1004', description: 'Communications Infrastructure', amount: 15000000, appropriation: 'OM-ARMY-2025', category: 'Infrastructure', obligatedAmount: 10000000, expendedAmount: 6000000 },
        { lineNumber: '1005', description: 'Training Exercises', amount: 12000000, appropriation: 'OM-ARMY-2025', category: 'Training', obligatedAmount: 8000000, expendedAmount: 4000000 }
      ],
      // Budget 2: Personnel Compensation
      [
        { lineNumber: '2001', description: 'Active Duty Salaries', amount: 45000000, appropriation: 'MILPERS-ARMY-2025', category: 'Personnel', obligatedAmount: 32000000, expendedAmount: 28000000 },
        { lineNumber: '2002', description: 'Healthcare Benefits', amount: 12000000, appropriation: 'MILPERS-ARMY-2025', category: 'Benefits', obligatedAmount: 8000000, expendedAmount: 6000000 },
        { lineNumber: '2003', description: 'Retirement Contributions', amount: 8000000, appropriation: 'MILPERS-ARMY-2025', category: 'Benefits', obligatedAmount: 5000000, expendedAmount: 4000000 }
      ],
      // Budget 3: R&D
      [
        { lineNumber: '3001', description: 'Advanced Technology Research', amount: 15000000, appropriation: 'RDTNE-2025', category: 'Research', obligatedAmount: 10000000, expendedAmount: 7000000 },
        { lineNumber: '3002', description: 'Prototype Development', amount: 12000000, appropriation: 'RDTNE-2025', category: 'Development', obligatedAmount: 8000000, expendedAmount: 6000000 },
        { lineNumber: '3003', description: 'Testing and Evaluation', amount: 8000000, appropriation: 'RDTNE-2025', category: 'Testing', obligatedAmount: 5000000, expendedAmount: 3000000 },
        { lineNumber: '3004', description: 'Laboratory Equipment', amount: 5000000, appropriation: 'RDTNE-2025', category: 'Equipment', obligatedAmount: 2000000, expendedAmount: 2000000 }
      ]
    ];

    for (let i = 0; i < 3; i++) {
      for (const lineData of lineItemsPerBudget[i]) {
        await lineItemService.createLineItem({
          budgetId: this.budgetIds[i],
          ...lineData,
          bpac: `BPAC-${lineData.lineNumber}`,
          status: 'active',
          createdBy: this.userIds['analyst1']
        });
      }
    }

    console.log('✓ Created 12 budget line items across 3 budgets');
  }

  private async seedObligations(): Promise<void> {
    const currentFyId = this.fiscalYearIds[`fy${new Date().getFullYear()}`];
    const obligations = [
      {
        budgetId: this.budgetIds[0],
        programElementId: this.programIds[0],
        documentNumber: 'OBL-2025-0001',
        amount: 5000000,
        description: 'Contract for equipment modernization',
        vendor: 'Defense Systems Corp',
        obligationDate: new Date(2024, 10, 15),
        status: ObligationStatus.OBLIGATED
      },
      {
        budgetId: this.budgetIds[0],
        programElementId: this.programIds[1],
        documentNumber: 'OBL-2025-0002',
        amount: 3500000,
        description: 'Vehicle maintenance contract',
        vendor: 'MilitaryTech Solutions',
        obligationDate: new Date(2024, 11, 1),
        status: ObligationStatus.OBLIGATED
      },
      {
        budgetId: this.budgetIds[1],
        documentNumber: 'OBL-2025-0003',
        amount: 8000000,
        description: 'Personnel services obligation',
        vendor: 'Government Services Inc',
        obligationDate: new Date(2024, 9, 1),
        status: ObligationStatus.OBLIGATED
      },
      {
        budgetId: this.budgetIds[2],
        programElementId: this.programIds[0],
        documentNumber: 'OBL-2025-0004',
        amount: 2500000,
        description: 'Research laboratory services',
        vendor: 'Advanced Research Labs',
        obligationDate: new Date(2025, 0, 10),
        status: ObligationStatus.OBLIGATED
      },
      {
        budgetId: this.budgetIds[4],
        documentNumber: 'OBL-2025-0005',
        amount: 1200000,
        description: 'Pending procurement approval',
        vendor: 'Equipment Suppliers LLC',
        obligationDate: new Date(2025, 2, 1),
        status: ObligationStatus.PENDING
      }
    ];

    for (const oblData of obligations) {
      await obligationService.createObligation({
        ...oblData,
        fiscalYearId: currentFyId,
        createdBy: this.userIds['finance1']
      });
    }

    console.log('✓ Created 5 obligations');
  }

  private async seedExpenditures(): Promise<void> {
    const currentFyId = this.fiscalYearIds[`fy${new Date().getFullYear()}`];
    const expenditures = [
      {
        budgetId: this.budgetIds[0],
        programElementId: this.programIds[0],
        amount: 2500000,
        description: 'First payment for equipment modernization',
        vendor: 'Defense Systems Corp',
        invoiceNumber: 'INV-2025-001',
        paymentDate: new Date(2024, 11, 15),
        status: ExpenditureStatus.PAID
      },
      {
        budgetId: this.budgetIds[0],
        programElementId: this.programIds[1],
        amount: 1750000,
        description: 'Vehicle maintenance payment - Q1',
        vendor: 'MilitaryTech Solutions',
        invoiceNumber: 'INV-2025-002',
        paymentDate: new Date(2024, 11, 20),
        status: ExpenditureStatus.PAID
      },
      {
        budgetId: this.budgetIds[1],
        amount: 4000000,
        description: 'Monthly personnel payments',
        vendor: 'Government Services Inc',
        invoiceNumber: 'INV-2025-003',
        paymentDate: new Date(2024, 9, 31),
        status: ExpenditureStatus.PAID
      },
      {
        budgetId: this.budgetIds[2],
        programElementId: this.programIds[0],
        amount: 1250000,
        description: 'Research services - Phase 1',
        vendor: 'Advanced Research Labs',
        invoiceNumber: 'INV-2025-004',
        paymentDate: new Date(2025, 0, 20),
        status: ExpenditureStatus.PAID
      },
      {
        budgetId: this.budgetIds[0],
        amount: 850000,
        description: 'Supplies and materials',
        vendor: 'Defense Logistics',
        invoiceNumber: 'INV-2025-005',
        paymentDate: new Date(2025, 1, 5),
        status: ExpenditureStatus.PAID
      },
      {
        budgetId: this.budgetIds[3],
        amount: 3200000,
        description: 'Aviation fuel and maintenance',
        vendor: 'Naval Supply Systems',
        invoiceNumber: 'INV-2025-006',
        paymentDate: new Date(2025, 1, 15),
        status: ExpenditureStatus.PAID
      },
      {
        budgetId: this.budgetIds[0],
        amount: 650000,
        description: 'Pending payment approval',
        vendor: 'Tech Services Inc',
        invoiceNumber: 'INV-2025-007',
        paymentDate: new Date(2025, 2, 10),
        status: ExpenditureStatus.PENDING
      }
    ];

    for (const expData of expenditures) {
      await expenditureService.createExpenditure({
        ...expData,
        fiscalYearId: currentFyId,
        createdBy: this.userIds['finance1']
      });
    }

    console.log('✓ Created 7 expenditures');
  }

  private async seedApprovalWorkflows(): Promise<void> {
    const workflows = [
      {
        name: 'Standard Budget Approval',
        description: 'Standard approval workflow for budget allocations under $50M',
        entityType: ApprovalEntityType.BUDGET,
        steps: [
          { order: 1, approverRole: UserRole.BUDGET_ANALYST, required: true },
          { order: 2, approverRole: UserRole.FINANCE_OFFICER, required: true },
          { order: 3, approverRole: UserRole.APPROVER, required: true }
        ]
      },
      {
        name: 'High Value Budget Approval',
        description: 'Approval workflow for budgets over $50M',
        entityType: ApprovalEntityType.BUDGET,
        steps: [
          { order: 1, approverRole: UserRole.BUDGET_ANALYST, required: true },
          { order: 2, approverRole: UserRole.PROGRAM_MANAGER, required: true },
          { order: 3, approverRole: UserRole.FINANCE_OFFICER, required: true },
          { order: 4, approverRole: UserRole.APPROVER, required: true },
          { order: 5, approverRole: UserRole.ADMIN, required: true }
        ]
      },
      {
        name: 'Program Element Approval',
        description: 'Approval workflow for program elements',
        entityType: ApprovalEntityType.PROGRAM,
        steps: [
          { order: 1, approverRole: UserRole.PROGRAM_MANAGER, required: true },
          { order: 2, approverRole: UserRole.APPROVER, required: true }
        ]
      }
    ];

    for (const workflow of workflows) {
      await approvalService.createWorkflow(workflow, this.userIds['admin']);
    }

    console.log('✓ Created 3 approval workflows');
  }

  private async seedApprovalRequests(): Promise<void> {
    const workflows = dataStore.findAll<any>('approvalWorkflows');
    const budgetWorkflow = workflows.find((w: any) => w.name === 'Standard Budget Approval');

    if (budgetWorkflow) {
      // Approved request with full history
      const approvedRequest = await approvalService.createApprovalRequest({
        workflowId: budgetWorkflow.id,
        entityType: ApprovalEntityType.BUDGET,
        entityId: this.budgetIds[0],
        comments: 'Requesting approval for FY 2025 Army Operations Budget'
      }, this.userIds['analyst1']);

      // Simulate approval actions
      await approvalService.processApproval(
        approvedRequest.id,
        ApprovalActionType.APPROVED,
        this.userIds['analyst2'],
        'Budget figures verified and accurate'
      );

      await approvalService.processApproval(
        approvedRequest.id,
        ApprovalActionType.APPROVED,
        this.userIds['finance1'],
        'Financial review complete, all appropriations valid'
      );

      await approvalService.processApproval(
        approvedRequest.id,
        ApprovalActionType.APPROVED,
        this.userIds['approver1'],
        'Final approval granted'
      );

      // Pending request
      const pendingRequest = await approvalService.createApprovalRequest({
        workflowId: budgetWorkflow.id,
        entityType: ApprovalEntityType.BUDGET,
        entityId: this.budgetIds[4],
        comments: 'Q2 2025 Procurement Request - urgent approval needed'
      }, this.userIds['analyst1']);

      // Partially approved
      await approvalService.processApproval(
        pendingRequest.id,
        ApprovalActionType.APPROVED,
        this.userIds['analyst2'],
        'Initial review complete'
      );

      console.log('✓ Created 2 approval requests with actions');
    }
  }

  private async seedComments(): Promise<void> {
    const comments = [
      {
        entityType: 'budget',
        entityId: this.budgetIds[0],
        content: 'Budget allocation looks reasonable for the planned operations. Recommend approval.',
        userId: this.userIds['analyst2'],
        username: 'analyst2'
      },
      {
        entityType: 'budget',
        entityId: this.budgetIds[0],
        content: 'Agreed. The line items are well-justified and align with the strategic priorities.',
        userId: this.userIds['manager1'],
        username: 'manager1'
      },
      {
        entityType: 'budget',
        entityId: this.budgetIds[4],
        content: 'Need more justification for the procurement requests. Please provide additional documentation.',
        userId: this.userIds['finance1'],
        username: 'finance1'
      },
      {
        entityType: 'budget',
        entityId: this.budgetIds[4],
        content: 'I will prepare the additional cost-benefit analysis and submit by EOD tomorrow.',
        userId: this.userIds['analyst1'],
        username: 'analyst1'
      },
      {
        entityType: 'program',
        entityId: this.programIds[0],
        content: 'Milestone 2 is tracking well. On schedule for June completion.',
        userId: this.userIds['manager2'],
        username: 'manager2'
      },
      {
        entityType: 'program',
        entityId: this.programIds[1],
        content: 'Prototype testing has begun. Initial results are promising.',
        userId: this.userIds['manager1'],
        username: 'manager1'
      }
    ];

    for (const commentData of comments) {
      await commentService.createComment(commentData);
    }

    console.log('✓ Created 6 comments');
  }

  private async seedNotifications(): Promise<void> {
    const notifications = [
      {
        userId: this.userIds['approver1'],
        type: NotificationType.APPROVAL_REQUEST,
        title: 'New Budget Approval Request',
        message: 'Q2 2025 Procurement Request requires your approval',
        entityType: 'budget',
        entityId: this.budgetIds[4],
        read: false,
        priority: NotificationPriority.HIGH
      },
      {
        userId: this.userIds['finance1'],
        type: NotificationType.APPROVAL_REQUEST,
        title: 'Budget Review Required',
        message: 'Q2 2025 Procurement Request needs financial review',
        entityType: 'budget',
        entityId: this.budgetIds[4],
        read: false,
        priority: NotificationPriority.MEDIUM
      },
      {
        userId: this.userIds['analyst1'],
        type: NotificationType.COMMENT_ADDED,
        title: 'New Comment on Your Budget',
        message: 'finance1 commented on Q2 2025 Procurement Request',
        entityType: 'budget',
        entityId: this.budgetIds[4],
        read: false,
        priority: NotificationPriority.MEDIUM
      },
      {
        userId: this.userIds['analyst1'],
        type: NotificationType.APPROVAL_APPROVED,
        title: 'Budget Approved',
        message: 'FY 2025 Army Operations Budget has been approved',
        entityType: 'budget',
        entityId: this.budgetIds[0],
        read: true,
        priority: NotificationPriority.MEDIUM
      },
      {
        userId: this.userIds['manager1'],
        type: NotificationType.THRESHOLD_EXCEEDED,
        title: 'Budget Threshold Alert',
        message: 'FY 2025 Army Operations Budget has exceeded 75% utilization',
        entityType: 'budget',
        entityId: this.budgetIds[0],
        read: false,
        priority: NotificationPriority.HIGH
      },
      {
        userId: this.userIds['admin'],
        type: NotificationType.SYSTEM,
        title: 'System Maintenance Scheduled',
        message: 'System maintenance scheduled for this weekend',
        read: false,
        priority: NotificationPriority.LOW
      },
      {
        userId: this.userIds['analyst2'],
        type: NotificationType.BUDGET_UPDATED,
        title: 'Budget Updated',
        message: 'FY 2025 Training & Readiness budget has been updated',
        entityType: 'budget',
        entityId: this.budgetIds[5],
        read: true,
        priority: NotificationPriority.LOW
      }
    ];

    for (const notificationData of notifications) {
      await notificationService.createNotification(notificationData);
    }

    console.log('✓ Created 7 notifications');
  }

  private async seedDocuments(): Promise<void> {
    const documents = [
      {
        entityType: 'budget',
        entityId: this.budgetIds[0],
        fileName: 'budget_justification_fy2025.pdf',
        originalName: 'FY2025 Budget Justification.pdf',
        mimeType: 'application/pdf',
        size: 2458000,
        path: '/uploads/budget_justification_fy2025.pdf',
        uploadedBy: this.userIds['analyst1'],
        description: 'Detailed budget justification for FY 2025 operations',
        tags: ['budget', 'justification', 'fy2025']
      },
      {
        entityType: 'budget',
        entityId: this.budgetIds[0],
        fileName: 'cost_benefit_analysis.xlsx',
        originalName: 'Cost Benefit Analysis.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1250000,
        path: '/uploads/cost_benefit_analysis.xlsx',
        uploadedBy: this.userIds['analyst1'],
        description: 'Cost-benefit analysis spreadsheet',
        tags: ['analysis', 'costs']
      },
      {
        entityType: 'program',
        entityId: this.programIds[0],
        fileName: 'modernization_plan.pdf',
        originalName: 'Army Modernization Plan.pdf',
        mimeType: 'application/pdf',
        size: 3870000,
        path: '/uploads/modernization_plan.pdf',
        uploadedBy: this.userIds['manager1'],
        description: 'Comprehensive modernization strategy and timeline',
        tags: ['program', 'modernization', 'planning']
      },
      {
        entityType: 'program',
        entityId: this.programIds[1],
        fileName: 'vehicle_specs.pdf',
        originalName: 'Combat Vehicle Technical Specifications.pdf',
        mimeType: 'application/pdf',
        size: 5240000,
        path: '/uploads/vehicle_specs.pdf',
        uploadedBy: this.userIds['manager2'],
        description: 'Technical specifications for vehicle upgrade program',
        tags: ['technical', 'specifications']
      },
      {
        entityType: 'budget',
        entityId: this.budgetIds[4],
        fileName: 'procurement_requirements.docx',
        originalName: 'Procurement Requirements.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 890000,
        path: '/uploads/procurement_requirements.docx',
        uploadedBy: this.userIds['analyst1'],
        description: 'Detailed requirements for Q2 procurement',
        tags: ['procurement', 'requirements']
      }
    ];

    for (const docData of documents) {
      const { uploadedBy, ...rest } = docData;
      await documentService.uploadDocument(rest, uploadedBy);
    }

    console.log('✓ Created 5 documents');
  }

  private async seedReports(): Promise<void> {
    const reports = [
      {
        name: 'FY 2025 Budget Summary Report',
        type: ReportType.BUDGET_SUMMARY,
        parameters: { fiscalYear: 2025, department: 'Army' },
        generatedBy: this.userIds['analyst1'],
        format: ReportFormat.PDF,
        filePath: '/reports/budget_summary_fy2025.pdf',
        status: ReportStatus.COMPLETED
      },
      {
        name: 'Q1 Execution Analysis',
        type: ReportType.EXECUTION_ANALYSIS,
        parameters: { quarter: 1, fiscalYear: 2025 },
        generatedBy: this.userIds['finance1'],
        format: ReportFormat.EXCEL,
        filePath: '/reports/execution_analysis_q1.xlsx',
        status: ReportStatus.COMPLETED
      },
      {
        name: 'Budget vs Actual Variance Report',
        type: ReportType.VARIANCE_REPORT,
        parameters: { budgetId: this.budgetIds[0] },
        generatedBy: this.userIds['analyst2'],
        format: ReportFormat.PDF,
        filePath: '/reports/variance_report.pdf',
        status: ReportStatus.COMPLETED
      },
      {
        name: 'Program Status Dashboard',
        type: ReportType.PROGRAM_STATUS,
        parameters: { fiscalYear: 2025 },
        generatedBy: this.userIds['manager1'],
        format: ReportFormat.PDF,
        status: ReportStatus.GENERATING
      },
      {
        name: 'Audit Log Export - February 2025',
        type: ReportType.AUDIT_LOG,
        parameters: { startDate: '2025-02-01', endDate: '2025-02-28' },
        generatedBy: this.userIds['admin'],
        format: ReportFormat.CSV,
        filePath: '/reports/audit_log_feb2025.csv',
        status: ReportStatus.COMPLETED
      }
    ];

    for (const reportData of reports) {
      const { generatedBy, ...rest } = reportData;
      await reportService.generateReport(rest, generatedBy);
    }

    console.log('✓ Created 5 reports');
  }

  private async seedVarianceAnalyses(): Promise<void> {
    const currentFyId = this.fiscalYearIds[`fy${new Date().getFullYear()}`];
    const variances = [
      {
        budgetId: this.budgetIds[0],
        fiscalYearId: currentFyId,
        period: '2025-Q1',
        plannedAmount: 20000000,
        actualAmount: 18500000,
        variance: -1500000,
        variancePercentage: -7.5,
        status: VarianceStatus.FAVORABLE,
        analysis: 'Under budget due to delayed equipment deliveries. Funds will be obligated in Q2.'
      },
      {
        budgetId: this.budgetIds[0],
        fiscalYearId: currentFyId,
        period: '2025-Q2',
        plannedAmount: 22000000,
        actualAmount: 24500000,
        variance: 2500000,
        variancePercentage: 11.4,
        status: VarianceStatus.UNFAVORABLE,
        analysis: 'Over budget due to expedited procurement requests and increased operational tempo.'
      },
      {
        budgetId: this.budgetIds[1],
        fiscalYearId: currentFyId,
        period: '2025-Q1',
        plannedAmount: 16000000,
        actualAmount: 16200000,
        variance: 200000,
        variancePercentage: 1.25,
        status: VarianceStatus.NEUTRAL,
        analysis: 'Personnel costs slightly higher than planned due to overtime requirements.'
      },
      {
        budgetId: this.budgetIds[2],
        fiscalYearId: currentFyId,
        period: '2025-Q1',
        plannedAmount: 10000000,
        actualAmount: 8500000,
        variance: -1500000,
        variancePercentage: -15.0,
        status: VarianceStatus.FAVORABLE,
        analysis: 'Research projects ahead of schedule and under budget. Excellent program management.'
      },
      {
        budgetId: this.budgetIds[3],
        fiscalYearId: currentFyId,
        period: '2025-Q1',
        plannedAmount: 18000000,
        actualAmount: 21000000,
        variance: 3000000,
        variancePercentage: 16.7,
        status: VarianceStatus.CRITICAL,
        analysis: 'Significant overrun due to emergency aircraft maintenance. Requires immediate attention.'
      }
    ];

    for (const varianceData of variances) {
      // Directly create in dataStore since variance data is already calculated
      dataStore.create('varianceAnalyses', {
        id: `var-${Date.now()}-${Math.random()}`,
        ...varianceData,
        createdAt: new Date()
      });
    }

    console.log('✓ Created 5 variance analyses');
  }

  private async seedAuditLogs(): Promise<void> {
    const auditLogs = [
      {
        userId: this.userIds['admin'],
        username: 'admin',
        action: AuditAction.LOGIN,
        entityType: 'user',
        entityId: this.userIds['admin'],
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(2025, 1, 1, 8, 30),
        success: true
      },
      {
        userId: this.userIds['analyst1'],
        username: 'analyst1',
        action: AuditAction.CREATE,
        entityType: 'budget',
        entityId: this.budgetIds[0],
        changes: { title: 'FY 2025 Army Operations Budget', amount: 85000000 },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(2025, 1, 1, 9, 15),
        success: true
      },
      {
        userId: this.userIds['analyst1'],
        username: 'analyst1',
        action: AuditAction.UPDATE,
        entityType: 'budget',
        entityId: this.budgetIds[0],
        changes: { allocatedAmount: { from: 80000000, to: 82000000 } },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(2025, 1, 2, 10, 30),
        success: true
      },
      {
        userId: this.userIds['approver1'],
        username: 'approver1',
        action: AuditAction.APPROVE,
        entityType: 'budget',
        entityId: this.budgetIds[0],
        changes: { approvalStatus: { from: 'pending', to: 'approved' } },
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(2025, 1, 3, 14, 20),
        success: true
      },
      {
        userId: this.userIds['finance1'],
        username: 'finance1',
        action: AuditAction.CREATE,
        entityType: 'obligation',
        entityId: 'obl-001',
        changes: { amount: 5000000, vendor: 'Defense Systems Corp' },
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(2025, 1, 5, 11, 45),
        success: true
      },
      {
        userId: this.userIds['analyst1'],
        username: 'analyst1',
        action: AuditAction.EXPORT,
        entityType: 'report',
        entityId: 'report-001',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(2025, 1, 10, 16, 0),
        success: true
      },
      {
        userId: this.userIds['manager1'],
        username: 'manager1',
        action: AuditAction.UPDATE,
        entityType: 'program',
        entityId: this.programIds[0],
        changes: { status: { from: 'programming', to: 'execution' } },
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(2025, 1, 12, 9, 30),
        success: true
      },
      {
        userId: this.userIds['analyst2'],
        username: 'analyst2',
        action: AuditAction.READ,
        entityType: 'budget',
        entityId: this.budgetIds[0],
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(2025, 1, 15, 13, 15),
        success: true
      }
    ];

    for (const logData of auditLogs) {
      dataStore.create('auditLogs', {
        id: `audit-${Date.now()}-${Math.random()}`,
        ...logData
      });
    }

    console.log('✓ Created 8 audit log entries');
  }

  private printSummary(): void {
    console.log('\n📊 Database Summary:');
    console.log(`   Users: ${dataStore.findAll('users').length}`);
    console.log(`   Organizations: ${dataStore.findAll('organizations').length}`);
    console.log(`   Fiscal Years: ${dataStore.findAll('fiscalYears').length}`);
    console.log(`   Appropriations: ${dataStore.findAll('appropriations').length}`);
    console.log(`   Program Elements: ${dataStore.findAll('programElements').length}`);
    console.log(`   Budgets: ${dataStore.findAll('budgets').length}`);
    console.log(`   Budget Line Items: ${dataStore.findAll('budgetLineItems').length}`);
    console.log(`   Obligations: ${dataStore.findAll('obligations').length}`);
    console.log(`   Expenditures: ${dataStore.findAll('expenditures').length}`);
    console.log(`   Approval Workflows: ${dataStore.findAll('approvalWorkflows').length}`);
    console.log(`   Approval Requests: ${dataStore.findAll('approvalRequests').length}`);
    console.log(`   Comments: ${dataStore.findAll('comments').length}`);
    console.log(`   Notifications: ${dataStore.findAll('notifications').length}`);
    console.log(`   Documents: ${dataStore.findAll('documents').length}`);
    console.log(`   Reports: ${dataStore.findAll('reports').length}`);
    console.log(`   Variance Analyses: ${dataStore.findAll('varianceAnalyses').length}`);
    console.log(`   Audit Logs: ${dataStore.findAll('auditLogs').length}`);

    console.log('\n👤 Login Credentials:');
    console.log('   Admin:           username: admin      password: admin123');
    console.log('   Budget Analyst:  username: analyst1   password: analyst123');
    console.log('   Budget Analyst:  username: analyst2   password: analyst123');
    console.log('   Program Manager: username: manager1   password: manager123');
    console.log('   Program Manager: username: manager2   password: manager123');
    console.log('   Finance Officer: username: finance1   password: finance123');
    console.log('   Approver:        username: approver1  password: approver123');
    console.log('   Approver:        username: approver2  password: approver123');
    console.log('   Viewer:          username: viewer1    password: viewer123');
  }
}

export const seedService = new SeedService();
