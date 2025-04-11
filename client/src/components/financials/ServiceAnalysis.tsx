import { useMemo } from "react";
import { AppointmentWithClientAndDogs, ServiceAnalysis as ServiceAnalysisType } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ServiceAnalysisProps = {
  appointments: AppointmentWithClientAndDogs[];
};

const ServiceAnalysis = ({ appointments }: ServiceAnalysisProps) => {
  const serviceData = useMemo(() => {
    // Group appointments by service type
    const serviceGroups = appointments.reduce((groups, appointment) => {
      const serviceType = appointment.serviceType;
      
      if (!groups[serviceType]) {
        groups[serviceType] = {
          serviceType,
          appointments: 0,
          totalIncome: 0,
          totalPrice: 0
        };
      }
      
      groups[serviceType].appointments += 1;
      groups[serviceType].totalIncome += Number(appointment.price);
      
      return groups;
    }, {} as Record<string, { serviceType: string; appointments: number; totalIncome: number; totalPrice: number }>);
    
    // Convert to array and calculate average price
    return Object.values(serviceGroups).map(group => ({
      serviceType: group.serviceType,
      appointments: group.appointments,
      averagePrice: group.totalIncome / group.appointments,
      total: group.totalIncome
    }));
  }, [appointments]);
  
  if (serviceData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Income by Service Type</h3>
        <div className="flex items-center justify-center h-40 bg-gray-50 rounded text-gray-500">
          No appointments found for this period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Income by Service Type</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Type</TableHead>
              <TableHead>Appointments</TableHead>
              <TableHead>Average Price</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serviceData.map((service) => (
              <TableRow key={service.serviceType}>
                <TableCell className="font-medium">{service.serviceType}</TableCell>
                <TableCell>{service.appointments}</TableCell>
                <TableCell>{formatCurrency(service.averagePrice)}</TableCell>
                <TableCell>{formatCurrency(service.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ServiceAnalysis;
