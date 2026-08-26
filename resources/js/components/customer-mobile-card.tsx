import { Customer } from '@/types';

interface CustomerMobileCardProps {
    customer: Customer;
    onViewDetails: (customer: Customer) => void;
}

export function CustomerMobileCard({ customer, onViewDetails }: CustomerMobileCardProps) {
    return (
        <div
            className="border-4 border-gray-300 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onViewDetails(customer)}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{customer.name}</h3>
                    <p className="text-sm text-gray-500">@{customer.name_user}</p>
                </div>
                {customer.tickets_count !== undefined && customer.tickets_count > 0 && (
                    <div className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full ml-3 flex-shrink-0">
                        {customer.tickets_count}
                    </div>
                )}
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</span>
                    <span className="text-gray-900 break-all">{customer.email}</span>
                </div>
                
                {customer.phone && (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</span>
                        <span className="text-gray-900 text-base font-medium">{customer.phone}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
