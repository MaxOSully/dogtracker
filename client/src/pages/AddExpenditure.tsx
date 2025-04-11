import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ExpenditureForm from "@/components/financials/ExpenditureForm";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertExpenditure } from "@/types";

const AddExpenditure = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (expenditureData: InsertExpenditure) => {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/expenditures', expenditureData);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/expenditures'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenditures/dateRange'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary/financials'] });
      
      toast({
        title: "Success!",
        description: "Expenditure has been recorded successfully.",
      });
      
      // Redirect to financials page
      navigate('/financials');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record expenditure. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Add Expenditure</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ExpenditureForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />
        </CardContent>
      </Card>
    </section>
  );
};

export default AddExpenditure;
