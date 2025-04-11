import { formatCurrency } from "@/lib/utils";
import { FinancialSummary as FinancialSummaryType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

type FinancialSummaryProps = {
  financialSummary?: FinancialSummaryType;
};

const FinancialSummary = ({ financialSummary }: FinancialSummaryProps) => {
  // This would be from previous period data in a real app
  const previousIncome = financialSummary?.income ? financialSummary.income - 420 : 0;
  const previousExpenses = financialSummary?.expenses ? financialSummary.expenses + 50 : 0;
  const previousNet = previousIncome - previousExpenses;
  
  const percentChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Income */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Income This Month</h3>
          {financialSummary ? (
            <>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(financialSummary.income)}
              </p>
              <p className="text-sm text-gray-500 flex items-center">
                {financialSummary.income > previousIncome ? (
                  <>
                    <ArrowUpIcon className="h-3 w-3 mr-1 text-green-500" />
                    <span className="text-green-500 mr-1">
                      {percentChange(financialSummary.income, previousIncome)}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="h-3 w-3 mr-1 text-red-500" />
                    <span className="text-red-500 mr-1">
                      {Math.abs(percentChange(financialSummary.income, previousIncome))}%
                    </span>
                  </>
                )}
                {formatCurrency(Math.abs(financialSummary.income - previousIncome))} from last month
              </p>
            </>
          ) : (
            <>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Expenses */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Expenses This Month</h3>
          {financialSummary ? (
            <>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(financialSummary.expenses)}
              </p>
              <p className="text-sm text-gray-500 flex items-center">
                {financialSummary.expenses < previousExpenses ? (
                  <>
                    <ArrowDownIcon className="h-3 w-3 mr-1 text-green-500" />
                    <span className="text-green-500 mr-1">
                      {Math.abs(percentChange(financialSummary.expenses, previousExpenses))}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowUpIcon className="h-3 w-3 mr-1 text-red-500" />
                    <span className="text-red-500 mr-1">
                      {percentChange(financialSummary.expenses, previousExpenses)}%
                    </span>
                  </>
                )}
                {formatCurrency(Math.abs(financialSummary.expenses - previousExpenses))} from last month
              </p>
            </>
          ) : (
            <>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Net Profit */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Net Profit</h3>
          {financialSummary ? (
            <>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(financialSummary.net)}
              </p>
              <p className="text-sm text-gray-500 flex items-center">
                {financialSummary.net > previousNet ? (
                  <>
                    <ArrowUpIcon className="h-3 w-3 mr-1 text-green-500" />
                    <span className="text-green-500 mr-1">
                      {percentChange(financialSummary.net, previousNet)}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="h-3 w-3 mr-1 text-red-500" />
                    <span className="text-red-500 mr-1">
                      {Math.abs(percentChange(financialSummary.net, previousNet))}%
                    </span>
                  </>
                )}
                {formatCurrency(Math.abs(financialSummary.net - previousNet))} from last month
              </p>
            </>
          ) : (
            <>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummary;
