import { useState } from "react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { AppointmentFilter, AppointmentWithClientAndDogs } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

type AppointmentsTableProps = {
  appointments: AppointmentWithClientAndDogs[];
  isLoading: boolean;
  filter: AppointmentFilter;
};

const AppointmentsTable = ({
  appointments,
  isLoading,
  filter,
}: AppointmentsTableProps) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter appointments based on the view
  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = parseISO(appointment.date.toString());
    const now = new Date();

    switch (filter.view) {
      case "upcoming":
        return appointmentDate >= now;
      case "past":
        return appointmentDate < now;
      case "overdue":
        // Logic for overdue would depend on your business rules
        // For now, let's say it's the same as past
        return appointmentDate < now;
      default:
        return true;
    }
  });

  // Filter by client if specified
  const finalFilteredAppointments = filter.clientId
    ? filteredAppointments.filter(
        (appointment) => appointment.client.id === filter.clientId
      )
    : filteredAppointments;

  // Sort appointments by date and time
  const sortedAppointments = [...finalFilteredAppointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = sortedAppointments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleCancelAppointment = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/appointments/${id}`);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/appointments/dateRange?startDate=${format(
            filter.dateRange.startDate,
            "yyyy-MM-dd"
          )}&endDate=${format(filter.dateRange.endDate, "yyyy-MM-dd")}`,
        ],
      });

      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (sortedAppointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No appointments found matching your criteria.
      </div>
    );
  }

  return (
    <>
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
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentAppointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="whitespace-nowrap">
                  {format(parseISO(appointment.date.toString()), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {format(parseISO(`2000-01-01T${appointment.time.split(':').slice(0,2).join(':')}`), 'h:mm a')}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {appointment.client.name}
                </TableCell>
                <TableCell>
                  {appointment.dogs.map((dog) => (
                    <div key={dog.id}>
                      {dog.name} ({dog.size}, {dog.hairLength} hair)
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
                  {getStatusBadge(appointment.status)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex gap-2">
                    <Link href={`/appointments/edit/${appointment.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelAppointment(appointment.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, sortedAppointments.length)} of{" "}
              {sortedAppointments.length} appointments
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={prevPage}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageToShow =
                    totalPages <= 5
                      ? i + 1
                      : currentPage <= 3
                      ? i + 1
                      : currentPage >= totalPages - 2
                      ? totalPages - 4 + i
                      : currentPage - 2 + i;

                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => paginate(pageToShow)}
                        isActive={currentPage === pageToShow}
                      >
                        {pageToShow}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentsTable;