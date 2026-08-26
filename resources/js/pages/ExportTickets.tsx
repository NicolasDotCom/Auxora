import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { PageProps, Ticket } from "@/types";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Download, Search, Filter, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface Props extends Omit<PageProps, 'tickets'> {
	tickets: Ticket[];
}

export default function ExportTickets({ auth, tickets: ticketsData }: Props) {
	const tickets = Array.isArray(ticketsData) ? ticketsData : [];
	
	const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
	const [selectAll, setSelectAll] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [technicianFilter, setTechnicianFilter] = useState<string>("all");
	const [customerFilter, setCustomerFilter] = useState<string>("all");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	// Obtener listas únicas para los filtros
	const technicians = useMemo(() => {
		const uniqueTechs = new Set(
			tickets.map((t) => t.support?.name).filter(Boolean)
		);
		return Array.from(uniqueTechs).sort();
	}, [tickets]);

	const customers = useMemo(() => {
		const uniqueCustomers = new Set(
			tickets.map((t) => t.customer?.name).filter(Boolean)
		);
		return Array.from(uniqueCustomers).sort();
	}, [tickets]);

	// Filtrar tickets según los criterios
	const filteredTickets = useMemo(() => {
		return tickets.filter((ticket) => {
			// Filtro por búsqueda (número, asunto, cliente, técnico)
			const matchesSearch =
				searchTerm === "" ||
				ticket.id.toString().includes(searchTerm) ||
				ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				ticket.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				ticket.support?.name?.toLowerCase().includes(searchTerm.toLowerCase());

			// Filtro por estado
			const matchesStatus =
				statusFilter === "all" || ticket.status === statusFilter;

			// Filtro por técnico
			const matchesTechnician =
				technicianFilter === "all" ||
				ticket.support?.name === technicianFilter ||
				(technicianFilter === "unassigned" && !ticket.support);

			// Filtro por cliente
			const matchesCustomer =
				customerFilter === "all" || ticket.customer?.name === customerFilter;

			// Filtro por fecha desde
			const matchesDateFrom =
				!dateFrom ||
				new Date(ticket.created_at) >= new Date(dateFrom);

			// Filtro por fecha hasta
			const matchesDateTo =
				!dateTo ||
				new Date(ticket.created_at) <= new Date(dateTo + "T23:59:59");

			return (
				matchesSearch &&
				matchesStatus &&
				matchesTechnician &&
				matchesCustomer &&
				matchesDateFrom &&
				matchesDateTo
			);
		});
	}, [tickets, searchTerm, statusFilter, technicianFilter, customerFilter, dateFrom, dateTo]);

	// Calcular paginación
	const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

	// Resetear a la primera página cuando cambien los filtros
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, statusFilter, technicianFilter, customerFilter, dateFrom, dateTo]);

	const handleSelectAll = (checked: boolean) => {
		setSelectAll(checked);
		if (checked) {
			setSelectedTickets(paginatedTickets.map((t) => t.id));
		} else {
			setSelectedTickets([]);
		}
	};

	const handleSelectTicket = (ticketId: number, checked: boolean) => {
		if (checked) {
			setSelectedTickets([...selectedTickets, ticketId]);
		} else {
			setSelectedTickets(selectedTickets.filter((id) => id !== ticketId));
			setSelectAll(false);
		}
	};

	const handleExportExcel = () => {
		if (selectedTickets.length === 0) {
			toast.error("Por favor, selecciona al menos un ticket para exportar");
			return;
		}

		const params = new URLSearchParams();
		selectedTickets.forEach((id) => params.append("tickets[]", id.toString()));

		window.location.href = `/dashboard/export-tickets?${params.toString()}`;
		toast.success(`Exportando ${selectedTickets.length} tickets a Excel...`);
	};

	const handleExportPDF = () => {
		if (selectedTickets.length === 0) {
			toast.error("Por favor, selecciona al menos un ticket para exportar");
			return;
		}

		const params = new URLSearchParams();
		selectedTickets.forEach((id) => params.append("tickets[]", id.toString()));

		window.location.href = `/dashboard/export-tickets-pdf?${params.toString()}`;
		toast.success(`Exportando ${selectedTickets.length} tickets a PDF...`);
	};

	const handleExportAllExcel = () => {
		if (filteredTickets.length === 0) {
			toast.error("No hay tickets para exportar con los filtros aplicados");
			return;
		}

		const params = new URLSearchParams();
		filteredTickets.forEach((ticket) => params.append("tickets[]", ticket.id.toString()));

		window.location.href = `/dashboard/export-tickets?${params.toString()}`;
		toast.success(`Exportando ${filteredTickets.length} tickets a Excel...`);
	};

	const handleExportAllPDF = () => {
		if (filteredTickets.length === 0) {
			toast.error("No hay tickets para exportar con los filtros aplicados");
			return;
		}

		const params = new URLSearchParams();
		filteredTickets.forEach((ticket) => params.append("tickets[]", ticket.id.toString()));

		window.location.href = `/dashboard/export-tickets-pdf?${params.toString()}`;
		toast.success(`Exportando ${filteredTickets.length} tickets a PDF...`);
	};

	const handleClearFilters = () => {
		setSearchTerm("");
		setStatusFilter("all");
		setTechnicianFilter("all");
		setCustomerFilter("all");
		setDateFrom("");
		setDateTo("");
		setSelectedTickets([]);
		setSelectAll(false);
		setCurrentPage(1);
		toast.info("Filtros limpiados");
	};

	const getStatusBadge = (status: string) => {
		const statusMap: Record<
			string,
			{ label: string; className: string }
		> = {
			Open: { label: "Abierto", className: "bg-red-600 hover:bg-red-700" },
			"In Progress": {
				label: "En Progreso",
				className: "bg-orange-500 hover:bg-orange-600",
			},
			Closed: { label: "Cerrado", className: "bg-green-600 hover:bg-green-700" },
		};

		const statusInfo = statusMap[status] || {
			label: status,
			className: "bg-gray-500",
		};
		return (
			<Badge className={statusInfo.className}>{statusInfo.label}</Badge>
		);
	};

	return (
		<AppLayout
			breadcrumbs={[
				{ title: "Inicio", href: "/dashboard" },
				{ title: "Exportar Tickets", href: "/export-tickets" },
			]}
		>
			<Head title="Exportar Tickets" />

			<div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
					{/* Filtros de Búsqueda */}
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-muted/40">
						<div className="col-span-full flex items-center gap-2 pb-2 border-b border-border/60">
							<Filter className="h-3.5 w-3.5 text-muted-foreground" />
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
							<Button
								variant="outline"
								size="sm"
								onClick={handleClearFilters}
								className="ml-auto h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
							>
								Limpiar Filtros
							</Button>
						</div>
						{/* Búsqueda por texto */}
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Buscar</label>
							<div className="relative">
								<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
								<Input
									placeholder="Número, asunto, cliente, técnico..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="h-9 pl-8"
								/>
							</div>
						</div>
						{/* Filtro por Estado */}
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Estado</label>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Todos los estados" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos los estados</SelectItem>
									<SelectItem value="Open">Abierto</SelectItem>
									<SelectItem value="In Progress">En Progreso</SelectItem>
									<SelectItem value="Closed">Cerrado</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{/* Filtro por Técnico */}
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Técnico Asignado</label>
							<Select value={technicianFilter} onValueChange={setTechnicianFilter}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Todos los técnicos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos los técnicos</SelectItem>
									<SelectItem value="unassigned">Sin asignar</SelectItem>
									{technicians.filter(tech => tech).map((tech) => (
										<SelectItem key={tech} value={tech!}>
											{tech}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{/* Filtro por Cliente */}
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Cliente</label>
							<Select value={customerFilter} onValueChange={setCustomerFilter}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Todos los clientes" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos los clientes</SelectItem>
									{customers.filter(customer => customer).map((customer) => (
										<SelectItem key={customer} value={customer!}>
											{customer}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{/* Fecha Desde */}
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Fecha Desde</label>
							<div className="relative">
								<Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
								<Input
									type="date"
									value={dateFrom}
									onChange={(e) => setDateFrom(e.target.value)}
									className="h-9 pl-8"
								/>
							</div>
						</div>
						{/* Fecha Hasta */}
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Fecha Hasta</label>
							<div className="relative">
								<Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
								<Input
									type="date"
									value={dateTo}
									onChange={(e) => setDateTo(e.target.value)}
									className="h-9 pl-8"
								/>
							</div>
						</div>
						{/* Resumen de resultados */}
						<div className="col-span-full mt-1 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
							<p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
								<strong>{filteredTickets.length}</strong> tickets encontrados
								{selectedTickets.length > 0 && (
									<span className="block sm:inline"><span className="hidden sm:inline"> • </span><strong>{selectedTickets.length}</strong> seleccionados</span>
								)}
							</p>
						</div>
					</div>

					{/* Tarjetas de Exportación */}
					<div className="mb-4 sm:mb-6 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
						<Card className="group hover:shadow-lg transition-all duration-300 hover:border-green-500">
							<CardHeader className="p-4 sm:p-6">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
											<FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 group-hover:text-green-500" />
											Exportar a Excel
										</CardTitle>
										<CardDescription className="mt-1 sm:mt-2 text-sm">
											Exporta los tickets seleccionados a
											formato CSV/Excel
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex flex-col gap-2 p-4 sm:p-6">
								<Button
									onClick={handleExportExcel}
									disabled={selectedTickets.length === 0}
									className="bg-green-600 hover:bg-green-700 w-full text-sm sm:text-base"
								>
									<Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
									<span className="hidden sm:inline">Exportar </span>Seleccionados ({selectedTickets.length})
								</Button>
								<Button
									onClick={handleExportAllExcel}
									variant="outline"
									className="border-green-500 text-green-600 hover:bg-green-50 w-full text-sm sm:text-base"
								>
									<FileSpreadsheet className="mr-2 h-4 w-4" />
									Exportar Todos ({filteredTickets.length})
								</Button>
							</CardContent>
						</Card>

						<Card className="group hover:shadow-lg transition-all duration-300 hover:border-red-500">
							<CardHeader className="p-4 sm:p-6">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
											<FileText className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 group-hover:text-red-500" />
											Exportar a PDF
										</CardTitle>
										<CardDescription className="mt-1 sm:mt-2 text-sm">
											Exporta los tickets seleccionados a
											formato PDF
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex flex-col gap-2 p-4 sm:p-6">
								<Button
									onClick={handleExportPDF}
									disabled={selectedTickets.length === 0}
									className="bg-red-600 hover:bg-red-700 w-full text-sm sm:text-base"
								>
									<Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
									<span className="hidden sm:inline">Exportar </span>Seleccionados ({selectedTickets.length})
								</Button>
								<Button
									onClick={handleExportAllPDF}
									variant="outline"
									className="border-red-500 text-red-600 hover:bg-red-50 w-full text-sm sm:text-base"
								>
									<FileText className="mr-2 h-4 w-4" />
									Exportar Todos ({filteredTickets.length})
								</Button>
							</CardContent>
						</Card>
					</div>

					{/* Tabla de Tickets */}
					<Card>
						<CardHeader className="p-4 sm:p-6">
							<CardTitle className="text-lg sm:text-xl">Selecciona los Tickets a Exportar</CardTitle>
							<CardDescription className="text-sm">
								Marca los tickets que deseas incluir en la exportación ({filteredTickets.length} tickets mostrados)
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 sm:p-6">
							<div className="rounded-md border overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-10 sm:w-12">
												<Checkbox
													checked={selectAll}
													onCheckedChange={handleSelectAll}
												/>
											</TableHead>
											<TableHead className="text-xs sm:text-sm">Ticket #</TableHead>
											<TableHead className="text-xs sm:text-sm">Asunto</TableHead>
											<TableHead className="text-xs sm:text-sm hidden md:table-cell">Cliente</TableHead>
											<TableHead className="text-xs sm:text-sm hidden lg:table-cell">Técnico</TableHead>
											<TableHead className="text-xs sm:text-sm">Estado</TableHead>
											<TableHead className="text-xs sm:text-sm hidden xl:table-cell">Fecha Creación</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredTickets.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={7}
													className="text-center text-muted-foreground py-8"
												>
													{tickets.length === 0 
														? "No hay tickets disponibles para exportar"
														: "No se encontraron tickets con los filtros aplicados"}
												</TableCell>
											</TableRow>
										) : (
											paginatedTickets.map((ticket) => (
												<TableRow
													key={ticket.id}
													className={`hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 dark:hover:from-blue-950/20 dark:hover:via-indigo-950/20 dark:hover:to-purple-950/20 transition-all duration-300 ${
														selectedTickets.includes(
															ticket.id
														)
															? "bg-blue-50/50 dark:bg-blue-950/30"
															: ""
													}`}
												>
													<TableCell>
														<Checkbox
															checked={selectedTickets.includes(
																ticket.id
															)}
															onCheckedChange={(
																checked
															) =>
																handleSelectTicket(
																	ticket.id,
																	checked as boolean
																)
															}
														/>
													</TableCell>
													<TableCell className="font-medium text-xs sm:text-sm">
														#{ticket.id}
													</TableCell>
													<TableCell className="text-xs sm:text-sm">
														<div className="max-w-xs truncate">
															{ticket.subject}
														</div>
													</TableCell>
													<TableCell className="text-xs sm:text-sm hidden md:table-cell">
														{ticket.customer?.name ||
															"N/A"}
													</TableCell>
													<TableCell className="text-xs sm:text-sm hidden lg:table-cell">
														{ticket.support?.name ||
															"Sin asignar"}
													</TableCell>
													<TableCell>
														{getStatusBadge(
															ticket.status
														)}
													</TableCell>
													<TableCell className="text-xs sm:text-sm hidden xl:table-cell">
														{new Date(
															ticket.created_at
														).toLocaleDateString(
															"es-ES"
														)}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>

							{/* Controles de Paginación */}
							{filteredTickets.length > 0 && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
									<div className="text-sm text-muted-foreground">
										Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTickets.length)} de {filteredTickets.length} tickets
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
											disabled={currentPage === 1}
										>
											<ChevronLeft className="h-4 w-4" />
											<span className="hidden sm:inline ml-1">Anterior</span>
										</Button>
										<div className="flex items-center gap-1">
											{Array.from({ length: totalPages }, (_, i) => i + 1)
												.filter(page => {
													// Mostrar primera página, última página, página actual y páginas adyacentes
													return page === 1 || 
														   page === totalPages || 
														   (page >= currentPage - 1 && page <= currentPage + 1);
												})
												.map((page, index, array) => {
													// Agregar puntos suspensivos si hay saltos
													const showEllipsisBefore = index > 0 && page > array[index - 1] + 1;
													return (
														<div key={page} className="flex items-center">
															{showEllipsisBefore && (
																<span className="px-2 text-muted-foreground">...</span>
															)}
															<Button
																variant={currentPage === page ? "default" : "outline"}
																size="sm"
																onClick={() => setCurrentPage(page)}
																className="w-8 h-8 p-0"
															>
																{page}
															</Button>
														</div>
													);
												})}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
											disabled={currentPage === totalPages}
										>
											<span className="hidden sm:inline mr-1">Siguiente</span>
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
			</div>
		</AppLayout>
	);
}
