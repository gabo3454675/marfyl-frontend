'use client';

import {
  LazyPieChart as PieChart,
  LazyPie as Pie,
  LazyCell as Cell,
  LazyResponsiveContainer as ResponsiveContainer,
  LazyTooltip as Tooltip,
  LazyLegend as Legend,
} from '@/components/charts/recharts-lazy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ExpenseChartsProps {
  categoryBreakdown: {
    categoryId: number;
    categoryName: string;
    amount: number;
  }[];
  formatCurrency: (amount: number) => string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ExpenseCharts({ categoryBreakdown, formatCurrency }: ExpenseChartsProps) {
  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Categoría</CardTitle>
          <CardDescription>Gastos del mes actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[240px] text-muted-foreground">
            Sin datos de gastos
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieChartData = categoryBreakdown.map((item, index) => ({
    name: item.categoryName,
    value: item.amount,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por Categoría</CardTitle>
        <CardDescription>Gastos del mes actual</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: { name: string; percent: number }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
