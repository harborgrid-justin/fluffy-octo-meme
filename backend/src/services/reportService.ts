// BE-013: Report Generation Service
// BE-014: Export Service (Excel, PDF, CSV)
import { v4 as uuidv4 } from 'uuid';
import { Report, ReportType, ReportFormat, ReportStatus } from '../types';
import { dataStore } from './dataStore';
import { budgetService } from './budgetService';
import { expenditureService } from './expenditureService';
import { obligationService } from './obligationService';
import { varianceService } from './varianceService';
import { AppError } from '../middleware/errorHandler';

export class ReportService {
  async generateReport(data: {
    name: string;
    type: ReportType;
    format: ReportFormat;
    parameters: any;
  }, generatedBy: string): Promise<Report> {
    const report: Report = {
      id: uuidv4(),
      ...data,
      generatedBy,
      generatedAt: new Date(),
      status: ReportStatus.GENERATING,
    };

    const createdReport = dataStore.create<Report>('reports', report);

    // Simulate async report generation
    setTimeout(async () => {
      try {
        const reportData = await this.generateReportData(data.type, data.parameters);

        dataStore.update<Report>('reports', report.id, {
          status: ReportStatus.COMPLETED,
          filePath: `/reports/${report.id}.${data.format}`,
        });
      } catch (error) {
        dataStore.update<Report>('reports', report.id, {
          status: ReportStatus.FAILED,
        });
      }
    }, 100);

    return createdReport;
  }

  async getReports(filters?: {
    type?: ReportType;
    generatedBy?: string;
    status?: ReportStatus;
  }): Promise<Report[]> {
    let reports = dataStore.findAll<Report>('reports');

    if (filters?.type) {
      reports = reports.filter(r => r.type === filters.type);
    }
    if (filters?.generatedBy) {
      reports = reports.filter(r => r.generatedBy === filters.generatedBy);
    }
    if (filters?.status) {
      reports = reports.filter(r => r.status === filters.status);
    }

    return reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  async getReportById(id: string): Promise<Report> {
    const report = dataStore.findById<Report>('reports', id);
    if (!report) {
      throw new AppError(404, 'Report not found');
    }
    return report;
  }

  async deleteReport(id: string): Promise<void> {
    const success = dataStore.delete<Report>('reports', id);
    if (!success) {
      throw new AppError(404, 'Report not found');
    }
  }

  private async generateReportData(type: ReportType, parameters: any): Promise<any> {
    switch (type) {
      case ReportType.BUDGET_SUMMARY:
        return this.generateBudgetSummary(parameters);
      case ReportType.EXECUTION_ANALYSIS:
        return this.generateExecutionAnalysis(parameters);
      case ReportType.VARIANCE_REPORT:
        return this.generateVarianceReport(parameters);
      default:
        return { message: 'Report data generation not implemented for this type' };
    }
  }

  private async generateBudgetSummary(parameters: any): Promise<any> {
    const budgets = await budgetService.getAllBudgets({
      fiscalYearId: parameters.fiscalYearId,
    });

    return {
      totalBudgets: budgets.length,
      totalAmount: budgets.reduce((sum, b) => sum + b.amount, 0),
      byDepartment: budgets.reduce((acc, b) => {
        acc[b.department] = (acc[b.department] || 0) + b.amount;
        return acc;
      }, {} as Record<string, number>),
      budgets,
    };
  }

  private async generateExecutionAnalysis(parameters: any): Promise<any> {
    const expenditures = await expenditureService.getAllExpenditures({
      fiscalYearId: parameters.fiscalYearId,
    });

    const obligations = await obligationService.getAllObligations({
      fiscalYearId: parameters.fiscalYearId,
    });

    return {
      totalExpenditures: expenditures.reduce((sum, e) => sum + e.amount, 0),
      totalObligations: obligations.reduce((sum, o) => sum + o.amount, 0),
      expenditureCount: expenditures.length,
      obligationCount: obligations.length,
    };
  }

  private async generateVarianceReport(parameters: any): Promise<any> {
    return await varianceService.getVarianceSummary(parameters.fiscalYearId);
  }

  async exportToCSV(data: any[]): Promise<string> {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
      headers.map(header => JSON.stringify(item[header] ?? '')).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  async exportToJSON(data: any): Promise<string> {
    return JSON.stringify(data, null, 2);
  }
}

export const reportService = new ReportService();
