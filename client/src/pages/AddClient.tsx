import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ClientForm from "@/components/clients/ClientForm";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertClient, DogFormInput } from "@/types";

const AddClient = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (clientData: InsertClient, dogsData: DogFormInput[]) => {
    setIsSubmitting(true);
    try {
      // Map the dog data to the format expected by the backend
      const dogs = dogsData.map(dog => ({
        name: dog.name,
        size: dog.size,
        hairLength: dog.hairLength
      }));

      await apiRequest('POST', '/api/clients', { client: clientData, dogs });
      
      // Invalidate clients query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      
      toast({
        title: "Success!",
        description: "Client has been created successfully.",
      });
      
      // Redirect to clients list
      navigate('/clients');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Add New Client</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ClientForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />
        </CardContent>
      </Card>
    </section>
  );
};

export default AddClient;
