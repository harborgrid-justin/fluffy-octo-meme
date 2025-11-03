// BE-008: Organization Hierarchy API
import { v4 as uuidv4 } from 'uuid';
import { Organization, OrganizationType } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class OrganizationService {
  async createOrganization(data: {
    name: string;
    code: string;
    type: OrganizationType;
    parentId?: string;
    description?: string;
  }): Promise<Organization> {
    // Check if code already exists
    const existing = dataStore.findOne<Organization>(
      'organizations',
      org => org.code === data.code
    );

    if (existing) {
      throw new AppError(400, 'Organization with this code already exists');
    }

    // Calculate level based on parent
    let level = 0;
    if (data.parentId) {
      const parent = await this.getOrganizationById(data.parentId);
      level = parent.level + 1;
    }

    const organization: Organization = {
      id: uuidv4(),
      ...data,
      level,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dataStore.create<Organization>('organizations', organization);
  }

  async getAllOrganizations(filters?: {
    type?: OrganizationType;
    parentId?: string;
    active?: boolean;
  }): Promise<Organization[]> {
    let orgs = dataStore.findAll<Organization>('organizations');

    if (filters?.type) {
      orgs = orgs.filter(o => o.type === filters.type);
    }
    if (filters?.parentId) {
      orgs = orgs.filter(o => o.parentId === filters.parentId);
    }
    if (filters?.active !== undefined) {
      orgs = orgs.filter(o => o.active === filters.active);
    }

    return orgs.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }

  async getOrganizationById(id: string): Promise<Organization> {
    const org = dataStore.findById<Organization>('organizations', id);
    if (!org) {
      throw new AppError(404, 'Organization not found');
    }
    return org;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const updatedOrg = dataStore.update<Organization>('organizations', id, updates);
    if (!updatedOrg) {
      throw new AppError(404, 'Organization not found');
    }
    return updatedOrg;
  }

  async deleteOrganization(id: string): Promise<void> {
    // Check if organization has children
    const children = await this.getChildren(id);
    if (children.length > 0) {
      throw new AppError(400, 'Cannot delete organization with child organizations');
    }

    const success = dataStore.delete<Organization>('organizations', id);
    if (!success) {
      throw new AppError(404, 'Organization not found');
    }
  }

  async getChildren(parentId: string): Promise<Organization[]> {
    return dataStore.findMany<Organization>(
      'organizations',
      org => org.parentId === parentId
    );
  }

  async getHierarchy(rootId?: string): Promise<any[]> {
    const orgs = rootId
      ? await this.getChildren(rootId)
      : dataStore.findMany<Organization>('organizations', org => !org.parentId);

    const buildTree = async (org: Organization): Promise<any> => {
      const children = await this.getChildren(org.id);
      return {
        ...org,
        children: await Promise.all(children.map(child => buildTree(child))),
      };
    };

    return Promise.all(orgs.map(org => buildTree(org)));
  }

  async getAncestors(id: string): Promise<Organization[]> {
    const ancestors: Organization[] = [];
    let current = await this.getOrganizationById(id);

    while (current.parentId) {
      const parent = await this.getOrganizationById(current.parentId);
      ancestors.push(parent);
      current = parent;
    }

    return ancestors;
  }
}

export const organizationService = new OrganizationService();
