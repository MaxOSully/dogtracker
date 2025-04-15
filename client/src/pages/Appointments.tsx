import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import AppointmentsTable from "@/components/appointments/AppointmentsTable";
import AppointmentFilters from "@/components/appointments/AppointmentFilters";
import ClientInsights from "@/components/appointments/ClientInsights";
import { AppointmentFilter, AppointmentWithClientAndDogs, ClientWithDogs } from "@/types";
import { startOfMonth, endOfMonth, format } from "date-fns";

const Appointments = () => {
  const today = new Date();
  const [filter, setFilter] = useState<AppointmentFilter>({
    view: 'upcoming',
    dateRange: {
      startDate: startOfMonth(today),
      endDate: endOfMonth(today)
    }
  });

  // Fetch appointments based on the filter
  const { data: appointments, isLoading } = useQuery<AppointmentWithClientAndDogs[]>({
    queryKey: ['/api/appointments/dateRange', format(filter.dateRange.startDate, 'yyyy-MM-dd'), format(filter.dateRange.endDate, 'yyyy-MM-dd')],
    queryFn: async ({ queryKey }) => {
      const [_, startDate, endDate] = queryKey;
      console.log(`Fetching appointments for date range: ${startDate} to ${endDate}`);
      return fetch(`/api/appointments/dateRange?startDate=${startDate}&endDate=${endDate}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch appointments');
        return res.json();
      });
    },
    // Make sure to always refetch when queryKey changes to ensure we get updated data
    refetchOnWindowFocus: false
  });

  // Fetch overdue clients
  const { data: overdueClients } = useQuery<ClientWithDogs[]>({
    queryKey: ['/api/summary/overdue-clients'],
  });

  // Fetch suggested follow-ups
  const { data: suggestedFollowUps } = useQuery<ClientWithDogs[]>({
    queryKey: ['/api/summary/suggested-followups'],
  });

  const handleFilterChange = (newFilter: AppointmentFilter) => {
    setFilter(newFilter);
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Appointments</h2>
        <Link href="/appointments/add">
          <Button>
            Add New Appointment
          </Button>
        </Link>
      </div>

      {/* Filter and Controls */}
      <AppointmentFilters 
        filter={filter} 
        onFilterChange={handleFilterChange}
      />

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <AppointmentsTable 
          appointments={appointments || []} 
          isLoading={isLoading}
          filter={filter}
        />
      </div>
      
      {/* Client Insights */}
      <ClientInsights 
        overdueClients={overdueClients || []}
        suggestedFollowUps={suggestedFollowUps || []}
      />
    </section>
  );
};

export default Appointments;
