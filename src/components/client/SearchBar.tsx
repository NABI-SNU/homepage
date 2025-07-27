import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, onQueryChange, onSearch }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    onQueryChange(newQuery);
    onSearch();
  };

  return (
    <div className="relative w-full sm:w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder="Search for a paper"
        className="w-full border rounded-md p-2 pl-10 bg-white text-black dark:bg-[#040620] dark:text-white dark:border-slate-700"
        value={query}
        onChange={handleInputChange}
      />
    </div>
  );
};

export default SearchBar;
