import { userService } from './userService';
import { fiscalYearService } from './fiscalYearService';
import { organizationService } from './organizationService';
import { UserRole, FiscalYearStatus, OrganizationType } from '../types';

export class InitService {
  async initializeDefaultData(): Promise<void> {
    try {
      // Create default admin user
      await userService.createUser({
        username: 'admin',
        password: 'admin123',
        email: 'admin@ppbe.gov',
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        department: 'Administration',
      });
      console.log('✓ Default admin user created (username: admin, password: admin123)');

      // Create sample users
      await userService.createUser({
        username: 'analyst',
        password: 'analyst123',
        email: 'analyst@ppbe.gov',
        firstName: 'Budget',
        lastName: 'Analyst',
        role: UserRole.BUDGET_ANALYST,
        department: 'Budget Office',
      });

      await userService.createUser({
        username: 'manager',
        password: 'manager123',
        email: 'manager@ppbe.gov',
        firstName: 'Program',
        lastName: 'Manager',
        role: UserRole.PROGRAM_MANAGER,
        department: 'Program Office',
      });

      console.log('✓ Sample users created');

      // Create fiscal years
      const currentYear = new Date().getFullYear();
      for (let i = -1; i <= 3; i++) {
        const year = currentYear + i;
        await fiscalYearService.createFiscalYear({
          year,
          name: `FY ${year}`,
          status: i === 0 ? FiscalYearStatus.CURRENT : i < 0 ? FiscalYearStatus.CLOSED : FiscalYearStatus.FUTURE,
          startDate: new Date(year, 9, 1), // October 1
          endDate: new Date(year + 1, 8, 30), // September 30
          totalBudget: 1000000000, // $1B
        });
      }
      console.log('✓ Fiscal years initialized');

      // Create organization hierarchy
      const dod = await organizationService.createOrganization({
        name: 'Department of Defense',
        code: 'DOD',
        type: OrganizationType.DEPARTMENT,
        description: 'Department of Defense',
      });

      const army = await organizationService.createOrganization({
        name: 'Department of the Army',
        code: 'DA',
        type: OrganizationType.DEPARTMENT,
        parentId: dod.id,
        description: 'Department of the Army',
      });

      await organizationService.createOrganization({
        name: 'Army Budget Office',
        code: 'ABO',
        type: OrganizationType.OFFICE,
        parentId: army.id,
        description: 'Army Budget Office',
      });

      const navy = await organizationService.createOrganization({
        name: 'Department of the Navy',
        code: 'DN',
        type: OrganizationType.DEPARTMENT,
        parentId: dod.id,
        description: 'Department of the Navy',
      });

      const airforce = await organizationService.createOrganization({
        name: 'Department of the Air Force',
        code: 'DAF',
        type: OrganizationType.DEPARTMENT,
        parentId: dod.id,
        description: 'Department of the Air Force',
      });

      console.log('✓ Organization hierarchy created');

      console.log('\n===========================================');
      console.log('Database initialized successfully!');
      console.log('===========================================');
      console.log('\nDefault Credentials:');
      console.log('Admin: username=admin, password=admin123');
      console.log('Analyst: username=analyst, password=analyst123');
      console.log('Manager: username=manager, password=manager123');
      console.log('===========================================\n');

    } catch (error) {
      console.error('Error initializing default data:', error);
      // Don't throw - allow server to start even if initialization fails
    }
  }
}

export const initService = new InitService();
