import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FinancialSummary from "@/components/financials/FinancialSummary";
import IncomeChart from "@/components/financials/IncomeChart";
import ServiceAnalysis from "@/components/financials/ServiceAnalysis";
import ExpenseCategories from "@/components/financials/ExpenseCategories";
import MonthlyDetail from "@/components/financials/MonthlyDetail";
import { FinancialSummary as FinancialSummaryType, AppointmentWithClientAndDogs, Expenditure } from "@/types";

const Financials = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timePeriod, setTimePeriod] = useState("30days"); // 30days, 3months, 6months, year
  
  // Calculate date range based on selected period
  const getDateRange = () => {
    const endDate = new Date();
    let startDate: Date;
    
    switch (timePeriod) {
      case "30days":
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "3months":
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6months":
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "year":
        startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return { startDate, endDate };
  };
  
  // For monthly details, we use the selected month
  const startOfCurrentMonth = startOfMonth(currentDate);
  const endOfCurrentMonth = endOfMonth(currentDate);
  
  // For the chart and summary, we use the selected period
  const { startDate: periodStartDate, endDate: periodEndDate } = getDateRange();
  
  // Financial summary query
  const { data: financialSummary } = useQuery<FinancialSummaryType>({
    queryKey: [`/api/summary/financials?startDate=${format(periodStartDate, 'yyyy-MM-dd')}&endDate=${format(periodEndDate, 'yyyy-MM-dd')}`],
  });
  
  // Appointments query for income data by service type
  const { data: appointments } = useQuery<AppointmentWithClientAndDogs[]>({
    queryKey: [`/api/appointments/dateRange?startDate=${format(periodStartDate, 'yyyy-MM-dd')}&endDate=${format(periodEndDate, 'yyyy-MM-dd')}`],
  });
  
  // Expenditures query for the same period
  const { data: expenditures } = useQuery<Expenditure[]>({
    queryKey: [`/api/expenditures/dateRange?startDate=${format(periodStartDate, 'yyyy-MM-dd')}&endDate=${format(periodEndDate, 'yyyy-MM-dd')}`],
  });
  
  // Monthly details - appointments and expenditures for the selected month
  const { data: monthlyAppointments } = useQuery<AppointmentWithClientAndDogs[]>({
    queryKey: [`/api/appointments/dateRange?startDate=${format(startOfCurrentMonth, 'yyyy-MM-dd')}&endDate=${format(endOfCurrentMonth, 'yyyy-MM-dd')}`],
  });
  
  const { data: monthlyExpenditures } = useQuery<Expenditure[]>({
    queryKey: [`/api/expenditures/dateRange?startDate=${format(startOfCurrentMonth, 'yyyy-MM-dd')}&endDate=${format(endOfCurrentMonth, 'yyyy-MM-dd')}`],
  });
  
  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };
  
  const handleNextMonth = () => {
    const nextMonth = addMonths(currentDate, 1);
    if (nextMonth <= new Date()) {
      setCurrentDate(nextMonth);
    }
  };
  
  const handlePeriodChange = (value: string) => {
    setTimePeriod(value);
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Financials</h2>
        <Link href="/financials/add-expenditure">
          <Button>
            Add Expenditure
          </Button>
        </Link>
      </div>

      {/* Financial Summary Cards */}
      <FinancialSummary financialSummary={financialSummary} />

      {/* Financial Analytics */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Income Trends</h3>
          <Select defaultValue={timePeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <IncomeChart 
          appointments={appointments || []} 
          expenditures={expenditures || []}
          startDate={periodStartDate}
          endDate={periodEndDate}
          period={timePeriod}
        />
      </div>

      {/* Service Type Analysis & Expense Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ServiceAnalysis appointments={appointments || []} />
        <ExpenseCategories expenditures={expenditures || []} />
      </div>

      {/* Monthly Detail */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Monthly Detail</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousMonth}
            >
              ←
            </Button>
            <span className="text-sm">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextMonth}
              disabled={format(currentDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM')}
            >
              →
            </Button>
          </div>
        </div>
        <MonthlyDetail 
          appointments={monthlyAppointments || []} 
          expenditures={monthlyExpenditures || []}
          month={currentDate}
        />
      </div>
    </section>
  );
};

export default Financials;
