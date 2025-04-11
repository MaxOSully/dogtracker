import { useMemo } from "react";
import { Expenditure, ExpenseCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";

type ExpenseCategoriesProps = {
  expenditures: Expenditure[];
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

const ExpenseCategories = ({ expenditures }: ExpenseCategoriesProps) => {
  const categoryData = useMemo(() => {
    const totalAmount = expenditures.reduce((total, expenditure) => total + Number(expenditure.amount), 0);
    
    // Group expenditures by category
    const categoryGroups = expenditures.reduce((groups, expenditure) => {
      const category = expenditure.category;
      
      if (!groups[category]) {
        groups[category] = {
          category,
          amount: 0
        };
      }
      
      groups[category].amount += Number(expenditure.amount);
      
      return groups;
    }, {} as Record<string, { category: string; amount: number }>);
    
    // Convert to array and calculate percentages
    return Object.values(categoryGroups)
      .map(group => ({
        category: group.category,
        amount: group.amount,
        percentage: totalAmount > 0 ? Math.round((group.amount / totalAmount) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenditures]);
  
  if (categoryData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Expenses by Category</h3>
        <div className="flex items-center justify-center h-40 bg-gray-50 rounded text-gray-500">
          No expenditures found for this period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Expenses by Category</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryData.map((category) => (
                <TableRow key={category.category}>
                  <TableCell className="font-medium">{category.category}</TableCell>
                  <TableCell>{formatCurrency(category.amount)}</TableCell>
                  <TableCell>{category.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCategories;
