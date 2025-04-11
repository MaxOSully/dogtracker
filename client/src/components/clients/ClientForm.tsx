import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema } from "@shared/schema";
import { z } from "zod";
import { InsertClient, DogFormInput } from "@/types";
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
import DogInfo from "./DogInfo";
import { Link } from "wouter";

// Extend the client schema with validation
const clientFormSchema = insertClientSchema.extend({
  phone: z.string().min(10, "Phone number should be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
});

type ClientFormProps = {
  defaultValues?: InsertClient;
  defaultDogs?: DogFormInput[];
  onSubmit: (clientData: InsertClient, dogsData: DogFormInput[]) => void;
  isSubmitting: boolean;
};

const ClientForm = ({
  defaultValues = {
    name: "",
    phone: "",
    address: "",
    frequency: "",
    notes: "",
  },
  defaultDogs = [{ name: "", size: "Medium", hairLength: "Medium" }],
  onSubmit,
  isSubmitting,
}: ClientFormProps) => {
  const [dogs, setDogs] = useState<DogFormInput[]>(defaultDogs);

  const form = useForm<InsertClient>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  });

  const handleFormSubmit = (data: InsertClient) => {
    // Validate dogs data
    const validDogs = dogs.filter(dog => dog.name.trim() !== "");
    if (validDogs.length === 0) {
      form.setError("root", {
        message: "At least one dog is required",
      });
      return;
    }
    
    onSubmit(data, validDogs);
  };

  const addDog = () => {
    setDogs([...dogs, { name: "", size: "Medium", hairLength: "Medium" }]);
  };

  const updateDog = (index: number, updatedDog: DogFormInput) => {
    const newDogs = [...dogs];
    newDogs[index] = updatedDog;
    setDogs(newDogs);
  };

  const removeDog = (index: number) => {
    if (dogs.length > 1) {
      const newDogs = [...dogs];
      newDogs.splice(index, 1);
      setDogs(newDogs);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Full address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Dog Information</h4>
          
          {dogs.map((dog, index) => (
            <DogInfo
              key={index}
              dog={dog}
              onChange={(updatedDog) => updateDog(index, updatedDog)}
              onDelete={() => removeDog(index)}
              canDelete={dogs.length > 1}
            />
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDog}
            className="mt-2"
          >
            + Add Another Dog
          </Button>
        </div>

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Frequency</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Every 2 Months">Every 2 Months</SelectItem>
                  <SelectItem value="As Needed">As Needed</SelectItem>
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

        {form.formState.errors.root && (
          <p className="text-sm font-medium text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Link href="/clients">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;
