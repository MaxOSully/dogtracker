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

const EditClient = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: client, isLoading, error } = useQuery<ClientWithDogs>({
    queryKey: [`/api/clients/${id}`],
  });

  const handleSubmit = async (clientData: InsertClient, dogsData: DogFormInput[]) => {
    if (!client) return;
    
    setIsSubmitting(true);
    try {
      // Map the dog data to the format expected by the backend
      const dogs = dogsData.map(dog => ({
        id: dog.id,
        name: dog.name,
        breed: dog.breed,
        size: dog.size,
        hairLength: dog.hairLength
      }));

      // Send both client and dogs data in a single update request
      await apiRequest('PUT', `/api/clients/${id}`, {
        ...clientData,
        dogs: dogs
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

  const handleDelete = async () => {
    try {
      await apiRequest('DELETE', `/api/clients/${id}`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      
      toast({
        title: "Success!",
        description: "Client has been deleted successfully.",
      });
      
      // Redirect to clients list
      navigate('/clients');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
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
        <Button 
          variant="destructive" 
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete Client
        </Button>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              and all associated data including dogs and appointments.
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

export default EditClient;
