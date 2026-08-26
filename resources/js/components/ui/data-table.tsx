import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { DataTableSearch } from "./data-table-search";
import { SearchX } from "lucide-react";

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pagination?: {
        from: number;
        to: number;
        total: number;
        links: PaginationLink[];
        onPageChange: (url: string | null) => void;
    };
    onSearch?:(searchTerm:string) => void;
    searchPlaceholder?:string;
    searchTerm?: string;
    getRowTooltip?: (row: TData) => string | undefined;
    onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    pagination,
    onSearch,
    searchPlaceholder,
    searchTerm,
    getRowTooltip,
    onRowClick,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="flex flex-col gap-4">
            {onSearch && (
               <div className="flex items-center justify-between">
                    <DataTableSearch onSearch={onSearch} placeholder={searchPlaceholder} searchTerm={searchTerm}/>
               </div>
            )}
            <div className="w-full overflow-auto rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="whitespace-nowrap">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={`hover:bg-muted/50 transition-colors${onRowClick ? ' cursor-pointer' : ''}`}
                                    title={getRowTooltip ? getRowTooltip(row.original) : undefined}
                                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="whitespace-nowrap">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <SearchX className="h-10 w-10 opacity-30" />
                                        <div>
                                            <p className="text-sm font-medium">Sin resultados</p>
                                            <p className="text-xs opacity-70 mt-0.5">Intenta ajustar los filtros de búsqueda</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {pagination && <TablePagination {...pagination} />}
        </div>
    );
}
