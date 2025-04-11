import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addWeeks, parseISO } from "date-fns";
import { Link } from "wouter";
import AppointmentTable from "@/components/dashboard/AppointmentTable";
import StatsCards from "@/components/dashboard/StatsCards";
import { Button } from "@/components/ui/button";
import { AppointmentWithClientAndDogs } from "@/types";

const Dashboard = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  
  const now = new Date();
  const startDate = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });
  const endDate = endOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });
  
  const formatDateRange = (start: Date, end: Date) => {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };
  
  const { data: appointments, isLoading, error } = useQuery<AppointmentWithClientAndDogs[]>({
    queryKey: [`/api/appointments/dateRange?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`],
  });
  
  const nextWeek = () => setWeekOffset(prev => prev + 1);
  const prevWeek = () => setWeekOffset(prev => prev - 1);
  const currentWeek = () => setWeekOffset(0);
  
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
        <span className="text-sm text-gray-500">{format(now, 'EEEE, MMMM d, yyyy')}</span>
      </div>

      {/* Upcoming Appointments Card */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Upcoming Appointments</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevWeek}
              className="h-8 px-2"
            >
              ←
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={currentWeek}
              className="h-8 px-2"
              disabled={weekOffset === 0}
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextWeek}
              className="h-8 px-2"
            >
              →
            </Button>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatDateRange(startDate, endDate)}
            </span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="py-10 text-center">Loading appointments...</div>
        ) : error ? (
          <div className="py-10 text-center text-red-500">
            Failed to load appointments
          </div>
        ) : (
          <AppointmentTable appointments={appointments || []} />
        )}
        
        <div className="mt-4 flex justify-end">
          <Link href="/appointments/add">
            <Button>
              Add New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <StatsCards weekStartDate={startDate} weekEndDate={endDate} />
    </section>
  );
};

export default Dashboard;
