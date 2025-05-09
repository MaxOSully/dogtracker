import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AppointmentForm from "@/components/appointments/AppointmentForm";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AppointmentWithClientAndDogs, ClientWithDogs, InsertAppointment } from "@/types";
import { format, parseISO } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EditAppointment = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch the appointment data
  const { data: appointment, isLoading: isLoadingAppointment, error: appointmentError } = useQuery<AppointmentWithClientAndDogs>({
    queryKey: [`/api/appointments/${id}`],
  });

  // Fetch all clients for the form dropdown
  const { data: clients, isLoading: isLoadingClients } = useQuery<ClientWithDogs[]>({
    queryKey: ['/api/clients'],
  });

  const handleSubmit = async (appointmentData: InsertAppointment) => {
    if (!appointment) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest('PUT', `/api/appointments/${id}`, appointmentData);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: [`/api/appointments/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/dateRange'] });
      
      toast({
        title: "Success!",
        description: "Appointment has been updated successfully.",
      });
      
      // Redirect to appointments list
      navigate('/appointments');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest('DELETE', `/api/appointments/${id}`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/dateRange'] });
      
      toast({
        title: "Success",
        description: "Appointment has been deleted successfully.",
      });
      
      // Redirect to appointments list
      navigate('/appointments');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (isLoadingAppointment || isLoadingClients) {
    return (
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">Edit Appointment</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-20 w-full mb-4" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (appointmentError || !appointment || !clients) {
    return (
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">Edit Appointment</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">
              Error loading appointment data. Please try again.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/appointments')}>
                Back to Appointments
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
          Edit Appointment for {appointment.client.name}
        </h2>
        <Button 
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete Appointment
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <AppointmentForm 
            clients={clients || []}
            defaultValues={{
              clientId: appointment.clientId.toString(),
              date: format(parseISO(appointment.date.toString()), 'yyyy-MM-dd'),
              time: appointment.time.toString(),
              serviceType: appointment.serviceType,
              price: appointment.price.toString(),
              status: appointment.status,
              notes: appointment.notes || ""
            }}
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the appointment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default EditAppointment;
