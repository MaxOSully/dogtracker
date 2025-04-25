import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ClientsTable from "@/components/clients/ClientsTable";
import ClientSearch from "@/components/clients/ClientSearch";
import { ClientWithDogs } from "@/types";
import debounce from "lodash/debounce";

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all clients if not searching
  const { data: allClients, isLoading: isLoadingAll } = useQuery<ClientWithDogs[]>({
    queryKey: ['/api/clients'],
    enabled: !isSearching,
  });

  // Fetch search results if searching
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery<ClientWithDogs[]>({
    queryKey: [`/api/clients/search?term=${searchTerm}`],
    enabled: isSearching && searchTerm.length > 0,
  });

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setIsSearching(term.length > 0);
    }, 300),
    []
  );

  const handleSearch = (term: string) => {
    debouncedSearch(term);
  };

  const clients = isSearching ? searchResults : allClients;
  const isLoading = isSearching ? isLoadingSearch : isLoadingAll;

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Clients</h2>
        <Link href="/clients/add">
          <Button>
            Add New Client
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <ClientSearch onSearch={handleSearch} />

      {/* Clients List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ClientsTable 
          clients={clients || []} 
          isLoading={isLoading} 
          isSearchResults={isSearching} 
        />
      </div>
    </section>
  );
};

export default Clients;
