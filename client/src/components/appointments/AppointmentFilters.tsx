import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AppointmentFilter, ClientWithDogs } from "@/types";
import { format } from "date-fns";

type AppointmentFiltersProps = {
  filter: AppointmentFilter;
  onFilterChange: (filter: AppointmentFilter) => void;
};

const AppointmentFilters = ({ 
  filter, 
  onFilterChange 
}: AppointmentFiltersProps) => {
  const { data: clients, isLoading: isLoadingClients } = useQuery<ClientWithDogs[]>({
    queryKey: ['/api/clients'],
  });

  const handleViewChange = (view: string) => {
    onFilterChange({
      ...filter,
      view: view as AppointmentFilter['view']
    });
  };

  const handleStartDateChange = (date: string) => {
    onFilterChange({
      ...filter,
      dateRange: {
        ...filter.dateRange,
        startDate: new Date(date)
      }
    });
  };

  const handleEndDateChange = (date: string) => {
    onFilterChange({
      ...filter,
      dateRange: {
        ...filter.dateRange,
        endDate: new Date(date)
      }
    });
  };

  const handleClientChange = (clientId: string) => {
    onFilterChange({
      ...filter,
      clientId: clientId === 'all' ? undefined : parseInt(clientId)
    });
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>View</Label>
            <Select 
              value={filter.view} 
              onValueChange={handleViewChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Appointments</SelectItem>
                <SelectItem value="upcoming">Upcoming Appointments</SelectItem>
                <SelectItem value="past">Past Appointments</SelectItem>
                <SelectItem value="overdue">Overdue Clients</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Date Range</Label>
            <div className="flex gap-2 items-center">
              <Input 
                type="date" 
                value={format(filter.dateRange.startDate, 'yyyy-MM-dd')}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
              <span>to</span>
              <Input 
                type="date" 
                value={format(filter.dateRange.endDate, 'yyyy-MM-dd')}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label>Client</Label>
            <Select 
              value={filter.clientId?.toString() || 'all'} 
              onValueChange={handleClientChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentFilters;
