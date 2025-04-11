import { useMemo } from "react";
import { format, parseISO, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isEqual, isSameDay, isSameWeek, isSameMonth } from "date-fns";
import { AppointmentWithClientAndDogs, Expenditure } from "@/types";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

type IncomeChartProps = {
  appointments: AppointmentWithClientAndDogs[];
  expenditures: Expenditure[];
  startDate: Date;
  endDate: Date;
  period: string;
};

type ChartData = {
  date: string;
  income: number;
  expenses: number;
  profit: number;
}[];

const IncomeChart = ({ appointments, expenditures, startDate, endDate, period }: IncomeChartProps) => {
  const chartData = useMemo(() => {
    let intervals: Date[];
    let dateFormat: string;
    let groupingFn: (date: Date, interval: Date) => boolean;
    
    // Determine the intervals and date format based on the selected period
    switch (period) {
      case "30days":
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        dateFormat = "MMM d";
        groupingFn = isSameDay;
        break;
      case "3months":
      case "6months":
        intervals = eachWeekOfInterval({ start: startDate, end: endDate });
        dateFormat = "MMM d";
        groupingFn = isSameWeek;
        break;
      case "year":
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        dateFormat = "MMM";
        groupingFn = isSameMonth;
        break;
      default:
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        dateFormat = "MMM d";
        groupingFn = isSameDay;
    }
    
    // Initialize data array with dates and zero values
    const data: ChartData = intervals.map(interval => ({
      date: format(interval, dateFormat),
      income: 0,
      expenses: 0,
      profit: 0
    }));
    
    // Calculate income for each interval
    appointments.forEach(appointment => {
      const appointmentDate = parseISO(appointment.date.toString());
      const intervalIndex = intervals.findIndex(interval => groupingFn(appointmentDate, interval));
      
      if (intervalIndex !== -1) {
        data[intervalIndex].income += Number(appointment.price);
        data[intervalIndex].profit += Number(appointment.price);
      }
    });
    
    // Calculate expenses for each interval
    expenditures.forEach(expenditure => {
      const expenditureDate = parseISO(expenditure.date.toString());
      const intervalIndex = intervals.findIndex(interval => groupingFn(expenditureDate, interval));
      
      if (intervalIndex !== -1) {
        data[intervalIndex].expenses += Number(expenditure.amount);
        data[intervalIndex].profit -= Number(expenditure.amount);
      }
    });
    
    return data;
  }, [appointments, expenditures, startDate, endDate, period]);
  
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value, false)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={2}
            activeDot={{ r: 8 }} 
            name="Income"
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            name="Expenses"
          />
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={2}
            name="Net Profit"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeChart;
