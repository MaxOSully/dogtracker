import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ClientSearchProps = {
  onSearch: (term: string) => void;
};

const ClientSearch = ({ onSearch }: ClientSearchProps) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search by name or phone number"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <Button type="submit" className="bg-gray-800 hover:bg-gray-700">
            Search
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientSearch;
