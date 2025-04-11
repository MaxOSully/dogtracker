import { DogFormInput } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

type DogInfoProps = {
  dog: DogFormInput;
  onChange: (dog: DogFormInput) => void;
  onDelete: () => void;
  canDelete: boolean;
};

const DogInfo = ({ dog, onChange, onDelete, canDelete }: DogInfoProps) => {
  const handleChange = (field: keyof DogFormInput, value: string) => {
    onChange({ ...dog, [field]: value });
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <h5 className="text-sm font-medium">Dog Details</h5>
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor={`dog-name-${dog.id || 'new'}`}>Name</Label>
            <Input
              id={`dog-name-${dog.id || 'new'}`}
              placeholder="Dog's Name"
              value={dog.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor={`dog-size-${dog.id || 'new'}`}>Size</Label>
            <Select
              value={dog.size}
              onValueChange={(value) => handleChange("size", value)}
            >
              <SelectTrigger id={`dog-size-${dog.id || 'new'}`}>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Small">Small</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor={`dog-hair-${dog.id || 'new'}`}>Hair Length</Label>
            <Select
              value={dog.hairLength}
              onValueChange={(value) => handleChange("hairLength", value)}
            >
              <SelectTrigger id={`dog-hair-${dog.id || 'new'}`}>
                <SelectValue placeholder="Select hair length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Short">Short</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DogInfo;
