import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ClientForm from "@/components/clients/ClientForm";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ClientWithDogs, InsertClient, DogFormInput } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const EditClient = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: client, isLoading, error } = useQuery<ClientWithDogs>({
    queryKey: [`/api/clients/${id}`],
  });

  const handleSubmit = async (clientData: InsertClient, dogsData: DogFormInput[]) => {
    if (!client) return;
    
    setIsSubmitting(true);
    try {
      // Send both client and dogs data in a single update request
      await apiRequest('PUT', `/api/clients/${id}`, {
        ...clientData,
        dogs: dogsData.map(dog => ({
          id: dog.id, // This will be undefined for new dogs
          name: dog.name,
          size: dog.size,
          hairLength: dog.hairLength
        }))
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
      
      toast({
        title: "Success!",
        description: "Client has been updated successfully.",
      });
      
      // Redirect to clients list
      navigate('/clients');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">Edit Client</h2>
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

  if (error || !client) {
    return (
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">Edit Client</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">
              Error loading client data. Please try again.
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

  // Transform the client's dogs to the format expected by the form
  const dogFormInputs: DogFormInput[] = client.dogs.map(dog => ({
    id: dog.id,
    name: dog.name,
    size: dog.size,
    hairLength: dog.hairLength
  }));

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Edit Client: {client.name}</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ClientForm 
            defaultValues={{
              name: client.name,
              phone: client.phone,
              address: client.address,
              frequency: client.frequency || "",
              notes: client.notes || ""
            }}
            defaultDogs={dogFormInputs}
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />
        </CardContent>
      </Card>
    </section>
  );
};

export default EditClient;
