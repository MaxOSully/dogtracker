import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenditureSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { Link } from "wouter";
import { InsertExpenditure } from "@/types";
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

// Extend the expenditure schema with validation
const expenditureFormSchema = insertExpenditureSchema.extend({
  date: z.string().min(1, "Date is required"),
  amount: z.string().min(1, "Amount is required"),
});

// Form values type for this component
type ExpenditureFormValues = {
  date: string;
  amount: string;
  category: string;
  notes: string;
};

type ExpenditureFormProps = {
  defaultValues?: Partial<ExpenditureFormValues>;
  onSubmit: (expenditure: InsertExpenditure) => void;
  isSubmitting: boolean;
};

const EXPENDITURE_CATEGORIES = [
  "Supplies",
  "Equipment",
  "Marketing",
  "Travel",
  "Utilities",
  "Rent",
  "Insurance",
  "Taxes",
  "Wages",
  "Other"
];

const ExpenditureForm = ({
  defaultValues,
  onSubmit,
  isSubmitting,
}: ExpenditureFormProps) => {
  // Get today's date formatted for the date input
  const today = format(new Date(), "yyyy-MM-dd");
  
  const form = useForm<ExpenditureFormValues>({
    resolver: zodResolver(expenditureFormSchema),
    defaultValues: {
      date: defaultValues?.date || today,
      amount: defaultValues?.amount || "",
      category: defaultValues?.category || "Supplies",
      notes: defaultValues?.notes || "",
    },
  });

  const handleFormSubmit = (data: ExpenditureFormValues) => {
    // Transform the form data to match the InsertExpenditure type
    const expenditureData: InsertExpenditure = {
      date: new Date(data.date),
      amount: parseFloat(data.amount),
      category: data.category,
      notes: data.notes,
    };
    
    onSubmit(expenditureData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXPENDITURE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
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
          <Link href="/financials">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Expenditure"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ExpenditureForm;
