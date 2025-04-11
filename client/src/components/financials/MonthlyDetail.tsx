import { useMemo } from "react";
import { format, parseISO, getDate, getDaysInMonth, startOfWeek, endOfWeek, isSameDay, addDays } from "date-fns";
import { AppointmentWithClientAndDogs, Expenditure, DailyFinancials } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type MonthlyDetailProps = {
  appointments: AppointmentWithClientAndDogs[];
  expenditures: Expenditure[];
  month: Date;
};

const MonthlyDetail = ({ appointments, expenditures, month }: MonthlyDetailProps) => {
  // Generate daily financial data for the month
  const dailyData = useMemo(() => {
    const daysInMonth = getDaysInMonth(month);
    const dailyFinancials: DailyFinancials[] = [];
    
    // Initialize data for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      dailyFinancials.push({
        date: format(date, 'yyyy-MM-dd'),
        income: 0,
        expenses: 0,
        net: 0
      });
    }
    
    // Add income from appointments
    appointments.forEach(appointment => {
      const appointmentDate = parseISO(appointment.date.toString());
      const dayIndex = getDate(appointmentDate) - 1;
      
      if (dayIndex >= 0 && dayIndex < dailyFinancials.length) {
        dailyFinancials[dayIndex].income += Number(appointment.price);
        dailyFinancials[dayIndex].net += Number(appointment.price);
      }
    });
    
    // Add expenses
    expenditures.forEach(expenditure => {
      const expenditureDate = parseISO(expenditure.date.toString());
      const dayIndex = getDate(expenditureDate) - 1;
      
      if (dayIndex >= 0 && dayIndex < dailyFinancials.length) {
        dailyFinancials[dayIndex].expenses += Number(expenditure.amount);
        dailyFinancials[dayIndex].net -= Number(expenditure.amount);
      }
    });
    
    return dailyFinancials;
  }, [appointments, expenditures, month]);
  
  // Calculate weekly totals
  const weeklyTotals = useMemo(() => {
    const weeks: { startDate: Date; endDate: Date; income: number; expenses: number; net: number }[] = [];
    let currentWeekStart = startOfWeek(new Date(month.getFullYear(), month.getMonth(), 1), { weekStartsOn: 1 });
    
    while (currentWeekStart.getMonth() <= month.getMonth()) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      
      // Only include days in the current month
      const weekIncome = dailyData
        .filter(day => {
          const dayDate = parseISO(day.date);
          return dayDate >= currentWeekStart && 
                 dayDate <= currentWeekEnd && 
                 dayDate.getMonth() === month.getMonth();
        })
        .reduce((sum, day) => sum + day.income, 0);
        
      const weekExpenses = dailyData
        .filter(day => {
          const dayDate = parseISO(day.date);
          return dayDate >= currentWeekStart && 
                 dayDate <= currentWeekEnd && 
                 dayDate.getMonth() === month.getMonth();
        })
        .reduce((sum, day) => sum + day.expenses, 0);
      
      weeks.push({
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        income: weekIncome,
        expenses: weekExpenses,
        net: weekIncome - weekExpenses
      });
      
      currentWeekStart = addDays(currentWeekEnd, 1);
    }
    
    return weeks;
  }, [dailyData, month]);
  
  // Calculate month total
  const monthTotal = useMemo(() => {
    return dailyData.reduce((total, day) => {
      return {
        income: total.income + day.income,
        expenses: total.expenses + day.expenses,
        net: total.net + day.net
      };
    }, { income: 0, expenses: 0, net: 0 });
  }, [dailyData]);
  
  // Filter out days with no financial activity
  const activeDays = dailyData.filter(day => day.income > 0 || day.expenses > 0);
  
  const DayDetailDialog = ({ day }: { day: DailyFinancials }) => {
    const dayDate = parseISO(day.date);
    const dayAppointments = appointments.filter(appointment => 
      isSameDay(parseISO(appointment.date.toString()), dayDate)
    );
    
    const dayExpenditures = expenditures.filter(expenditure => 
      isSameDay(parseISO(expenditure.date.toString()), dayDate)
    );
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" className="text-primary h-auto p-0">
            View
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Details for {format(dayDate, 'MMMM d, yyyy')}</DialogTitle>
          </DialogHeader>
          
          {dayAppointments.length > 0 && (
            <>
              <h4 className="font-medium mt-4">Appointments</h4>
              <div className="max-h-[200px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayAppointments.map(appointment => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.client.name}</TableCell>
                        <TableCell>{appointment.serviceType}</TableCell>
                        <TableCell>{formatCurrency(Number(appointment.price))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          
          {dayExpenditures.length > 0 && (
            <>
              <h4 className="font-medium mt-4">Expenditures</h4>
              <div className="max-h-[200px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayExpenditures.map(expenditure => (
                      <TableRow key={expenditure.id}>
                        <TableCell>{expenditure.category}</TableCell>
                        <TableCell>{formatCurrency(Number(expenditure.amount))}</TableCell>
                        <TableCell>{expenditure.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          
          <div className="mt-4 text-right">
            <p className="text-sm">
              <span className="font-medium">Total Income:</span> {formatCurrency(day.income)}
            </p>
            <p className="text-sm">
              <span className="font-medium">Total Expenses:</span> {formatCurrency(day.expenses)}
            </p>
            <p className="text-sm font-medium">
              <span className="font-medium">Net:</span> {formatCurrency(day.net)}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  if (activeDays.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded text-gray-500">
        No financial activity found for this month
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Income</TableHead>
            <TableHead>Expenses</TableHead>
            <TableHead>Net</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeDays.map((day) => (
            <TableRow key={day.date}>
              <TableCell>
                {format(parseISO(day.date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>{formatCurrency(day.income)}</TableCell>
              <TableCell>{formatCurrency(day.expenses)}</TableCell>
              <TableCell className={day.net < 0 ? 'text-red-600' : ''}>
                {formatCurrency(day.net)}
              </TableCell>
              <TableCell>
                <DayDetailDialog day={day} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          {weeklyTotals.map((week, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                Week: {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d')}
              </TableCell>
              <TableCell>{formatCurrency(week.income)}</TableCell>
              <TableCell>{formatCurrency(week.expenses)}</TableCell>
              <TableCell className={week.net < 0 ? 'text-red-600' : ''}>
                {formatCurrency(week.net)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="font-medium">Month Total</TableCell>
            <TableCell>{formatCurrency(monthTotal.income)}</TableCell>
            <TableCell>{formatCurrency(monthTotal.expenses)}</TableCell>
            <TableCell className={monthTotal.net < 0 ? 'text-red-600' : ''}>
              {formatCurrency(monthTotal.net)}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default MonthlyDetail;
