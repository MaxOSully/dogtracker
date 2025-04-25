import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ClientSearchProps = {
  onSearch: (term: string) => void;
};

const ClientSearch = ({ onSearch }: ClientSearchProps) => {
  const [searchInput, setSearchInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    onSearch(value);
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search by client name, phone number, or dog name"
            value={searchInput}
            onChange={handleInputChange}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientSearch;
