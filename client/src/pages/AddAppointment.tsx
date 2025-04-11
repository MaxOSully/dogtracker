import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppointmentForm from "@/components/appointments/AppointmentForm";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertAppointment, ClientWithDogs } from "@/types";

const AddAppointment = () => {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get clientId from query params if available
  const params = new URLSearchParams(search);
  const clientIdParam = params.get('clientId');
  const preselectedClientId = clientIdParam ? parseInt(clientIdParam) : undefined;
  
  // Fetch clients for the form
  const { data: clients } = useQuery<ClientWithDogs[]>({
    queryKey: ['/api/clients'],
  });
  
  const handleSubmit = async (appointmentData: InsertAppointment) => {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/appointments', appointmentData);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/dateRange'] });
      
      toast({
        title: "Success!",
        description: "Appointment has been created successfully.",
      });
      
      // Redirect to appointments list
      navigate('/appointments');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Add New Appointment</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <AppointmentForm 
            clients={clients || []}
            preselectedClientId={preselectedClientId}
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />
        </CardContent>
      </Card>
    </section>
  );
};

export default AddAppointment;
