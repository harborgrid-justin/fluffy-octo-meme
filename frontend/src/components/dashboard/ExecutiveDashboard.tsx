import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardContent, Badge } from '../ui';

interface ExecutiveDashboardProps {
  budgetData?: any;
  executionData?: any;
  programData?: any;
}

export function ExecutiveDashboard({
  budgetData,
  executionData,
  programData
}: ExecutiveDashboardProps) {
  // Sample data - would be replaced with real data
  const budgetTrend = [
    { month: 'Jan', planned: 4000, actual: 3800 },
    { month: 'Feb', planned: 3000, actual: 3200 },
    { month: 'Mar', planned: 2000, actual: 1900 },
    { month: 'Apr', planned: 2780, actual: 2500 },
    { month: 'May', planned: 1890, actual: 2100 },
    { month: 'Jun', planned: 2390, actual: 2300 },
  ];

  const categoryAllocation = [
    { name: 'Personnel', value: 45, color: '#3b82f6' },
    { name: 'Operations', value: 25, color: '#10b981' },
    { name: 'Equipment', value: 20, color: '#f59e0b' },
    { name: 'Other', value: 10, color: '#ef4444' },
  ];

  const executionRate = [
    { quarter: 'Q1', rate: 85 },
    { quarter: 'Q2', rate: 88 },
    { quarter: 'Q3', rate: 92 },
    { quarter: 'Q4', rate: 87 },
  ];

  const keyMetrics = [
    { label: 'Total Budget', value: '$125.5M', change: '+5.2%', trend: 'up' },
    { label: 'Execution Rate', value: '88%', change: '+3.1%', trend: 'up' },
    { label: 'Active Programs', value: '42', change: '-2', trend: 'down' },
    { label: 'Pending Approvals', value: '8', change: '-4', trend: 'down' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {keyMetrics.map((metric, index) => (
          <Card key={index} padding="md">
            <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</div>
            <div className={`text-sm font-medium ${
              metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {metric.change}
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Trend */}
        <Card>
          <CardHeader
            title="Budget vs. Actual Spending"
            subtitle="Monthly comparison"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={budgetTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="planned"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Planned"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Allocation */}
        <Card>
          <CardHeader
            title="Budget Allocation by Category"
            subtitle="Current fiscal year"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryAllocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Rate */}
        <Card>
          <CardHeader
            title="Quarterly Execution Rate"
            subtitle="Percentage of budget executed"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={executionRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rate" fill="#3b82f6" name="Execution Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader
            title="Recent Activity"
            subtitle="Latest updates"
          />
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'Budget Approved',
                  description: 'FY2025 Operations Budget approved',
                  time: '2 hours ago',
                  type: 'success'
                },
                {
                  title: 'New Program Created',
                  description: 'Modernization Initiative Phase 2',
                  time: '5 hours ago',
                  type: 'info'
                },
                {
                  title: 'Execution Milestone',
                  description: 'Q2 targets achieved',
                  time: '1 day ago',
                  type: 'success'
                },
                {
                  title: 'Pending Approval',
                  description: '3 budgets awaiting review',
                  time: '2 days ago',
                  type: 'warning'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-4 border-b last:border-b-0">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' :
                    activity.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{activity.title}</div>
                    <div className="text-sm text-gray-600">{activity.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      <Card>
        <CardHeader title="Alerts & Notifications" />
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center">
                <Badge variant="warning" className="mr-3">Alert</Badge>
                <div>
                  <div className="font-medium">Budget Variance Detected</div>
                  <div className="text-sm text-gray-600">Operations budget exceeding planned amount by 12%</div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Review
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center">
                <Badge variant="info" className="mr-3">Info</Badge>
                <div>
                  <div className="font-medium">Quarterly Review Scheduled</div>
                  <div className="text-sm text-gray-600">Q3 budget review meeting on Friday at 2 PM</div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Calendar
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
