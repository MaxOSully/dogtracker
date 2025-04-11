import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { format } from "date-fns";
import { z } from "zod";
import { insertAppointmentSchema } from "@shared/schema";
import { InsertAppointment, ClientWithDogs, Dog } from "@/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

// Extend the appointment schema with validation
const appointmentFormSchema = insertAppointmentSchema
  .omit({ clientId: true })
  .extend({
    clientId: z.string().min(1, "Client is required"),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    price: z.string().min(1, "Price is required"),
  });

// Form values type for this component
type AppointmentFormValues = {
  clientId: string;
  date: string;
  time: string;
  serviceType: string;
  price: string;
  status: string;
  notes: string;
};

type AppointmentFormProps = {
  clients: ClientWithDogs[];
  defaultValues?: Partial<AppointmentFormValues>;
  preselectedClientId?: number;
  onSubmit: (appointment: InsertAppointment) => void;
  isSubmitting: boolean;
};

const AppointmentForm = ({
  clients,
  defaultValues,
  preselectedClientId,
  onSubmit,
  isSubmitting,
}: AppointmentFormProps) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    preselectedClientId?.toString() || defaultValues?.clientId || ""
  );
  
  // Get the selected client's dogs
  const selectedClient = clients.find(
    (client) => client.id.toString() === selectedClientId
  );
  
  // Get today's date formatted for the date input
  const today = format(new Date(), "yyyy-MM-dd");
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientId: preselectedClientId?.toString() || defaultValues?.clientId || "",
      date: defaultValues?.date || today,
      time: defaultValues?.time || "09:00",
      serviceType: defaultValues?.serviceType || "Wash",
      price: defaultValues?.price || "40",
      status: defaultValues?.status || "pending",
      notes: defaultValues?.notes || "",
    },
  });
  
  // Update the selected client ID when form value changes
  useEffect(() => {
    const clientId = form.watch("clientId");
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, [form.watch("clientId")]);

  const handleFormSubmit = (data: AppointmentFormValues) => {
    // Transform the form data to match the InsertAppointment type
    // For PostgreSQL, we need to format the date as YYYY-MM-DD
    const appointmentData: InsertAppointment = {
      clientId: parseInt(data.clientId),
      date: data.date, // Keep as string format YYYY-MM-DD
      time: data.time,
      serviceType: data.serviceType,
      price: data.price, // Keep price as string to match the schema expectations
      status: data.status,
      notes: data.notes,
    };
    
    onSubmit(appointmentData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedClient && (
          <Card>
            <CardContent className="pt-4">
              <h4 className="text-sm font-medium mb-2">Client Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Phone:</p>
                  <p className="text-sm">{selectedClient.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Address:</p>
                  <p className="text-sm">{selectedClient.address}</p>
                </div>
              </div>
              <h4 className="text-sm font-medium mt-4 mb-2">Dogs:</h4>
              <ul className="text-sm">
                {selectedClient.dogs.map((dog) => (
                  <li key={dog.id}>
                    {dog.name} ({dog.size}, {dog.hairLength} hair)
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Wash">Wash</SelectItem>
                    <SelectItem value="Cut & Wash">Cut & Wash</SelectItem>
                    <SelectItem value="Special Grooming">Special Grooming</SelectItem>
                    <SelectItem value="Nail Trim">Nail Trim</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional information..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Link href="/appointments">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Appointment"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AppointmentForm;
