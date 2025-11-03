import React, { useState } from 'react';
import { Button, Card, CardHeader, CardContent, Input, Select } from '../ui';
import { Budget, BudgetLineItem } from '@/types';

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'basic', title: 'Basic Information', description: 'Enter budget details' },
  { id: 'allocation', title: 'Budget Allocation', description: 'Allocate funds by category' },
  { id: 'line-items', title: 'Line Items', description: 'Add budget line items' },
  { id: 'review', title: 'Review & Submit', description: 'Review your budget' }
];

interface BudgetWizardProps {
  onComplete: (budget: Partial<Budget>) => void;
  onCancel: () => void;
}

export function BudgetWizard({ onComplete, onCancel }: BudgetWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [budgetData, setBudgetData] = useState<Partial<Budget>>({
    name: '',
    fiscalYear: new Date().getFullYear() + 1,
    organization: '',
    totalAmount: 0,
    lineItems: []
  });

  const [lineItemForm, setLineItemForm] = useState<Partial<BudgetLineItem>>({
    category: '',
    description: '',
    amount: 0
  });

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return budgetData.name && budgetData.organization && budgetData.totalAmount && budgetData.totalAmount > 0;
      case 1:
        return true;
      case 2:
        return budgetData.lineItems && budgetData.lineItems.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(budgetData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addLineItem = () => {
    if (lineItemForm.category && lineItemForm.amount) {
      const newLineItem: BudgetLineItem = {
        id: `temp-${Date.now()}`,
        budgetId: '',
        category: lineItemForm.category,
        subcategory: '',
        description: lineItemForm.description || '',
        amount: lineItemForm.amount,
        allocatedAmount: 0,
        executedAmount: 0,
        remainingAmount: lineItemForm.amount,
        order: (budgetData.lineItems?.length || 0) + 1,
        metadata: {}
      };

      setBudgetData({
        ...budgetData,
        lineItems: [...(budgetData.lineItems || []), newLineItem]
      });

      setLineItemForm({ category: '', description: '', amount: 0 });
    }
  };

  const removeLineItem = (id: string) => {
    setBudgetData({
      ...budgetData,
      lineItems: budgetData.lineItems?.filter(item => item.id !== id) || []
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              label="Budget Name"
              value={budgetData.name || ''}
              onChange={(e) => setBudgetData({ ...budgetData, name: e.target.value })}
              required
              fullWidth
              placeholder="e.g., FY2025 Operations Budget"
            />

            <Select
              label="Fiscal Year"
              value={budgetData.fiscalYear?.toString() || ''}
              onChange={(e) => setBudgetData({ ...budgetData, fiscalYear: parseInt(e.target.value) })}
              options={[
                { value: '2024', label: 'FY 2024' },
                { value: '2025', label: 'FY 2025' },
                { value: '2026', label: 'FY 2026' }
              ]}
              required
              fullWidth
            />

            <Input
              label="Organization"
              value={budgetData.organization || ''}
              onChange={(e) => setBudgetData({ ...budgetData, organization: e.target.value })}
              required
              fullWidth
              placeholder="Organization or department"
            />

            <Input
              label="Total Budget Amount"
              type="number"
              value={budgetData.totalAmount || ''}
              onChange={(e) => setBudgetData({ ...budgetData, totalAmount: parseFloat(e.target.value) || 0 })}
              required
              fullWidth
              placeholder="0.00"
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-gray-600">
              Total Budget: <span className="font-semibold">${budgetData.totalAmount?.toLocaleString()}</span>
            </p>
            <p className="text-sm text-gray-500">
              In the next step, you'll add specific line items that make up this budget.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3">Add Line Item</h4>
              <div className="space-y-3">
                <Input
                  label="Category"
                  value={lineItemForm.category || ''}
                  onChange={(e) => setLineItemForm({ ...lineItemForm, category: e.target.value })}
                  placeholder="e.g., Personnel, Equipment, Operations"
                  fullWidth
                />
                <Input
                  label="Description"
                  value={lineItemForm.description || ''}
                  onChange={(e) => setLineItemForm({ ...lineItemForm, description: e.target.value })}
                  placeholder="Brief description"
                  fullWidth
                />
                <Input
                  label="Amount"
                  type="number"
                  value={lineItemForm.amount || ''}
                  onChange={(e) => setLineItemForm({ ...lineItemForm, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  fullWidth
                />
                <Button onClick={addLineItem} size="sm">
                  Add Line Item
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Line Items ({budgetData.lineItems?.length || 0})</h4>
              {budgetData.lineItems && budgetData.lineItems.length > 0 ? (
                <div className="space-y-2">
                  {budgetData.lineItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border rounded p-3">
                      <div>
                        <div className="font-medium">{item.category}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">${item.amount.toLocaleString()}</span>
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Remove line item"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No line items added yet</p>
              )}
            </div>
          </div>
        );

      case 3:
        const totalLineItems = budgetData.lineItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Budget Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Budget Name</div>
                <div className="font-medium">{budgetData.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Fiscal Year</div>
                <div className="font-medium">FY {budgetData.fiscalYear}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Organization</div>
                <div className="font-medium">{budgetData.organization}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Budget</div>
                <div className="font-medium">${budgetData.totalAmount?.toLocaleString()}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Line Items ({budgetData.lineItems?.length || 0})</div>
              <div className="space-y-1">
                {budgetData.lineItems?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.category}</span>
                    <span className="font-medium">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total Line Items</span>
                  <span>${totalLineItems.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {totalLineItems !== budgetData.totalAmount && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                <strong>Note:</strong> Total line items (${totalLineItems.toLocaleString()}) does not match
                total budget (${budgetData.totalAmount?.toLocaleString()})
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader title="Create New Budget" subtitle="Follow the steps to create your budget" />

      <CardContent>
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="mt-2 text-xs text-center">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    style={{ maxWidth: '100px' }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <div>
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button variant="ghost" onClick={onCancel} className="ml-2">
              Cancel
            </Button>
          </div>
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            {currentStep === WIZARD_STEPS.length - 1 ? 'Submit Budget' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
