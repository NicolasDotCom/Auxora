import { Support } from '@/types';

interface SupportMobileCardProps {
    support: Support;
    onViewDetails: (support: Support) => void;
}

export function SupportMobileCard({ support, onViewDetails }: SupportMobileCardProps) {
    return (
        <div
            className="border-4 border-gray-300 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onViewDetails(support)}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{support.name}</h3>
                    <p className="text-sm text-gray-600 break-all">{support.email}</p>
                </div>
                {support.tickets_count !== undefined && support.tickets_count > 0 && (
                    <div className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-full ml-3 flex-shrink-0">
                        {support.tickets_count}
                    </div>
                )}
            </div>

            {support.phone && (
                <div className="flex flex-col gap-1 pt-3 border-t">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</span>
                    <span className="text-gray-900 text-base font-medium">{support.phone}</span>
                </div>
            )}
        </div>
    );
}
