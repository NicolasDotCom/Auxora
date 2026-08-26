import { PaginatedData } from '@/types';

export const defaultPaginatedData = <T>(): PaginatedData<T> => ({
    data: [],
    current_page: 1,
    from: 0,
    to: 0,
    total: 0,
    per_page: 10,
    last_page: 1,
    links: [],
});

export const normalizePaginatedData = <T>(
    data: PaginatedData<T> | { id: number; name: string }[] | undefined
): PaginatedData<T> => {
    if (!data) {
        return defaultPaginatedData<T>();
    }
    if ('data' in data && Array.isArray(data.data)) {
        return data as PaginatedData<T>;
    }
    if (Array.isArray(data)) {
        return {
            ...defaultPaginatedData<T>(),
            data: data.map((item) => ({
                id: item.id,
                name: item.name,
                email: '',
                phone: '',
                address: '',
                created_at: '',
                updated_at: '',
            })) as T[],
            total: data.length,
            from: 1,
            to: data.length,
        };
    }
    return defaultPaginatedData<T>();
};
