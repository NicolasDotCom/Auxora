import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface DataTableSearchProps {
    onSearch: (searchTerm: string) => void;
    placeholder?: string;
    searchTerm?: string;
}

export function DataTableSearch({onSearch, placeholder = 'Search...', searchTerm: externalTerm}:DataTableSearchProps) {

    const [searchTerm, setSearchTerm] = useState(externalTerm ?? '');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sincronizar cuando el padre limpia el valor
    useEffect(() => {
        if (externalTerm !== undefined && externalTerm !== searchTerm) {
            setSearchTerm(externalTerm);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalTerm]);

    useEffect(() => {
      if(timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout( ()=> {
        onSearch(searchTerm);
      }, 300)

      return () => {
        if(timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm])

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e)=>setSearchTerm(e.target.value)}
                className='pl-8'
            />
        </div>
    )
}
