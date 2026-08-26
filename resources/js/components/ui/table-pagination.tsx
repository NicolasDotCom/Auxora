import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface TablePaginationProps {
    from: number;
    to: number;
    total: number;
    links: PaginationLink[];
    onPageChange: (url: string | null) => void;
}

/** Genera los índices de páginas a mostrar con -1 como marcador de elipsis */
function buildPageWindow(totalPages: number, current: number, delta: number): number[] {
    const range: number[] = [];
    const left = Math.max(2, current - delta);
    const right = Math.min(totalPages - 1, current + delta);

    range.push(1);
    if (left > 2) range.push(-1); // elipsis izquierda
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push(-1); // elipsis derecha
    if (totalPages > 1) range.push(totalPages);

    return range;
}

export function TablePagination({ from, to, total, links, onPageChange }: TablePaginationProps) {
    const pageLinks = links.slice(1, -1);
    const prevLink = links[0];
    const nextLink = links[links.length - 1];
    const totalPages = pageLinks.length;
    const activeIndex = pageLinks.findIndex(l => l.active);
    const currentPage = activeIndex + 1;

    // Ventana: desktop muestra ± 2, móvil muestra ± 1
    const desktopPages = buildPageWindow(totalPages, currentPage, 2);
    const mobilePages  = buildPageWindow(totalPages, currentPage, 1);

    const Ellipsis = ({ keyVal }: { keyVal: string }) => (
        <PaginationItem key={keyVal}>
            <span className="flex h-9 w-8 items-center justify-center text-sm text-muted-foreground select-none">
                …
            </span>
        </PaginationItem>
    );

    const PageBtn = ({ pageNum }: { pageNum: number }) => {
        const link = pageLinks[pageNum - 1];
        if (!link) return null;
        return (
            <PaginationItem key={pageNum}>
                <PaginationLink
                    onClick={() => onPageChange(link.url)}
                    isActive={link.active}
                    className="cursor-pointer"
                >
                    {pageNum}
                </PaginationLink>
            </PaginationItem>
        );
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Mostrando {from} a {to} de {total} elementos
            </p>

            <Pagination className="order-1 sm:order-2 w-auto">
                <PaginationContent className="gap-0.5">
                    {/* Anterior */}
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => onPageChange(prevLink.url)}
                            className={!prevLink.url ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                        />
                    </PaginationItem>

                    {/* Desktop */}
                    <span className="hidden sm:contents">
                        {desktopPages.map((p, i) =>
                            p === -1
                                ? <Ellipsis key={`de-${i}`} keyVal={`de-${i}`} />
                                : <PageBtn key={p} pageNum={p} />
                        )}
                    </span>

                    {/* Móvil */}
                    <span className="contents sm:hidden">
                        {mobilePages.map((p, i) =>
                            p === -1
                                ? <Ellipsis key={`mo-${i}`} keyVal={`mo-${i}`} />
                                : <PageBtn key={p} pageNum={p} />
                        )}
                    </span>

                    {/* Siguiente */}
                    <PaginationItem>
                        <PaginationNext
                            onClick={() => onPageChange(nextLink.url)}
                            className={!nextLink.url ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}

export default TablePagination;

