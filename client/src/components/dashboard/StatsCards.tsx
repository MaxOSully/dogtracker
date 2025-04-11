import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FinancialSummary, ClientWithDogs, Appointment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type StatsCardsProps = {
  weekStartDate: Date;
  weekEndDate: Date;
};

const StatsCards = ({ weekStartDate, weekEndDate }: StatsCardsProps) => {
  // Query for this week's appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: [`/api/appointments/dateRange?startDate=${format(weekStartDate, 'yyyy-MM-dd')}&endDate=${format(weekEndDate, 'yyyy-MM-dd')}`],
  });

  // Query for financial summary
  const { data: financialSummary, isLoading: isLoadingFinancials } = useQuery<FinancialSummary>({
    queryKey: [`/api/summary/financials?startDate=${format(weekStartDate, 'yyyy-MM-dd')}&endDate=${format(weekEndDate, 'yyyy-MM-dd')}`],
  });

  // Query for overdue clients that need to be called
  const { data: overdueClients, isLoading: isLoadingOverdue } = useQuery<ClientWithDogs[]>({
    queryKey: ['/api/summary/overdue-clients'],
  });

  // Calculate improvement percentages (would be from API in a real app)
  const calculateImprovement = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* This Week's Appointments */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">This Week</h3>
          {isLoadingAppointments ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <>
              <p className="text-2xl font-semibold text-gray-800">
                {appointments?.length || 0} Appointments
              </p>
              <p className="text-sm text-gray-500">
                {calculateImprovement(appointments?.length || 0, (appointments?.length || 0) - 2) > 0 ? '↑' : '↓'} 
                {' '}
                {Math.abs(calculateImprovement(appointments?.length || 0, (appointments?.length || 0) - 2))}% from last week
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pending Calls */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Calls</h3>
          {isLoadingOverdue ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <>
              <p className="text-2xl font-semibold text-gray-800">
                {overdueClients?.length || 0} Clients
              </p>
              <p className="text-sm text-gray-500">
                Need to schedule appointments
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Revenue This Week */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Revenue This Week</h3>
          {isLoadingFinancials ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <>
              <p className="text-2xl font-semibold text-gray-800">
                ${financialSummary?.income.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-500">
                {calculateImprovement(financialSummary?.income || 0, (financialSummary?.income || 0) - 120) > 0 ? '↑' : '↓'} 
                {' '}
                ${Math.abs(120).toFixed(2)} from last week
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
