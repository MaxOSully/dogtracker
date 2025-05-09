import { format, parseISO } from 'date-fns';
import { Link } from 'wouter';
import { AppointmentWithClientAndDogs } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type AppointmentTableProps = {
  appointments: AppointmentWithClientAndDogs[];
};

const AppointmentTable = ({ appointments }: AppointmentTableProps) => {
  // Sort appointments by date and time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  if (sortedAppointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No appointments scheduled for this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Dog(s)</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAppointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell className="whitespace-nowrap">
                {format(parseISO(appointment.date.toString()), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {format(parseISO(`2000-01-01T${appointment.time}`), 'h:mm a')}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {appointment.client.name}
              </TableCell>
              <TableCell>
                {appointment.dogs.map((dog) => (
                  <div key={dog.id}>
                    {dog.name}{dog.breed ? ` (${dog.breed})` : ` (${dog.size}, ${dog.hairLength} hair)`}
                  </div>
                ))}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {appointment.serviceType}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                ${Number(appointment.price).toFixed(2)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Link href={`/appointments/edit/${appointment.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AppointmentTable;
