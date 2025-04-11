import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ClientWithDogs, AppointmentWithClientAndDogs } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPhoneNumber } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ClientDetails = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("info");
  
  // Fetch client data
  const { data: client, isLoading, error } = useQuery<ClientWithDogs>({
    queryKey: [`/api/clients/${id}`],
  });
  
  // Fetch client appointments
  const { data: appointments } = useQuery<AppointmentWithClientAndDogs[]>({
    queryKey: [`/api/appointments?clientId=${id}`],
    enabled: !!client,
  });
  
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            <Skeleton className="h-8 w-40" />
          </h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
          </CardContent>
        </Card>
      </section>
    );
  }
  
  if (error || !client) {
    return (
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">Client Not Found</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">
              Error loading client data. The client might not exist.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/clients')}>
                Back to Clients
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          Client: {client.name}
        </h2>
        <div className="flex gap-2">
          <Link href={`/appointments/add?clientId=${client.id}`}>
            <Button>Schedule Appointment</Button>
          </Link>
          <Link href={`/clients/edit/${client.id}`}>
            <Button variant="outline">Edit Client</Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-80 grid-cols-3">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="dogs">Dogs</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-500">Name:</div>
                    <div>{client.name}</div>
                    
                    <div className="text-gray-500">Phone:</div>
                    <div>{formatPhoneNumber(client.phone)}</div>
                    
                    <div className="text-gray-500">Frequency:</div>
                    <div>{client.frequency || "Not specified"}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Address</h3>
                  <p className="whitespace-pre-line">{client.address}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <p className="whitespace-pre-line">{client.notes || "No additional notes."}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dogs" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.dogs.map((dog) => (
              <Card key={dog.id}>
                <CardHeader>
                  <CardTitle className="text-xl">{dog.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-500">Size:</div>
                    <div>{dog.size}</div>
                    
                    <div className="text-gray-500">Hair Length:</div>
                    <div>{dog.hairLength}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {client.dogs.length === 0 && (
              <Card className="col-span-2">
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No dogs registered for this client.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {appointments && appointments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            {format(parseISO(appointment.date.toString()), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>{appointment.time}</TableCell>
                          <TableCell>{appointment.serviceType}</TableCell>
                          <TableCell>${Number(appointment.price).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                appointment.status === 'completed' ? 'default' : 
                                appointment.status === 'cancelled' ? 'destructive' : 
                                'outline'
                              }
                            >
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/appointments/edit/${appointment.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-gray-500">No appointment history for this client.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default ClientDetails;