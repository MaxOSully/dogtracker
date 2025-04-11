import { useState } from "react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { ClientWithDogs } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ClientsTableProps = {
  clients: ClientWithDogs[];
  isLoading: boolean;
  isSearchResults: boolean;
};

const ClientsTable = ({ clients, isLoading, isSearchResults }: ClientsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Calculate pagination
  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = clients.slice(indexOfFirstItem, indexOfLastItem);
  
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  
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
  
  if (clients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isSearchResults 
          ? "No clients found matching your search criteria."
          : "No clients found. Add your first client to get started."}
      </div>
    );
  }
  
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Dog(s)</TableHead>
              <TableHead>Last Appt</TableHead>
              <TableHead>Next Appt</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="whitespace-nowrap">
                  C{String(client.id).padStart(5, '0')}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {client.name}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {client.phone}
                </TableCell>
                <TableCell>
                  {client.dogs.map((dog) => (
                    <div key={dog.id}>
                      {dog.name} ({dog.size}, {dog.hairLength} hair)
                    </div>
                  ))}
                </TableCell>
                <TableCell className="whitespace-nowrap text-gray-500">
                  {client.lastAppointment 
                    ? format(parseISO(client.lastAppointment.date.toString()), 'MMM d, yyyy')
                    : 'None'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-gray-500">
                  {client.nextAppointment 
                    ? format(parseISO(client.nextAppointment.date.toString()), 'MMM d, yyyy')
                    : client.lastAppointment ? (
                      <span className="text-amber-600">Overdue</span>
                    ) : 'None'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex gap-2">
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <Link href={`/clients/edit/${client.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
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
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, clients.length)} of {clients.length} clients
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={prevPage} disabled={currentPage === 1} />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageToShow = totalPages <= 5
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
                  <PaginationNext onClick={nextPage} disabled={currentPage === totalPages} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientsTable;
