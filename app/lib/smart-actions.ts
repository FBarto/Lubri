'use server';

import { prisma } from '../../lib/prisma';

export type SearchResult = {
    id: string | number;
    label: string;
    subLabel?: string;
    value: string;
    data?: any;
};

// 1. Search Vehicles (Make/Model)
export async function searchVehicleModels(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const vehicles = await prisma.vehicle.findMany({
        where: {
            OR: [
                { model: { contains: query, mode: 'insensitive' } },
                { brand: { contains: query, mode: 'insensitive' } }
            ]
        },
        take: 20,
        distinct: ['brand', 'model']
    });

    return vehicles.map(v => ({
        id: v.id,
        label: `${v.brand || ''} ${v.model || ''}`.trim(),
        value: `${v.brand || ''} ${v.model || ''}`.trim(),
        subLabel: v.plate
    }));
}

// 2. Search Products (Oils, Filters)
export async function searchProducts(query: string, category?: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const products = await prisma.product.findMany({
        where: {
            name: { contains: query, mode: 'insensitive' },
            ...(category ? { category: { contains: category, mode: 'insensitive' } } : {})
        },
        take: 20
    });

    return products.map(p => ({
        id: p.id,
        label: p.name,
        value: p.name,
        subLabel: `$${p.price.toFixed(2)} - Stock: ${p.stock}`
    }));
}

// 3. Get Insights (What filters/oils does this model usually use?)
export async function getVehicleInsights(modelString: string) {
    if (!modelString) return null;

    // Use WorkOrders to find what was sold for this vehicle model
    // WorkOrder has relation 'vehicle'.
    // We want completed work orders.
    const workOrders = await prisma.workOrder.findMany({
        where: {
            vehicle: {
                OR: [
                    { model: { contains: modelString, mode: 'insensitive' } },
                    { brand: { contains: modelString, mode: 'insensitive' } }
                ]
            },
            status: { not: 'PENDING' }
        },
        include: {
            saleItems: true
        },
        take: 50,
        orderBy: { date: 'desc' }
    });

    // Aggregate Items from WorkOrder.saleItems
    const productCounts: Record<string, { name: string, count: number, type: string }> = {};

    workOrders.forEach(wo => {
        wo.saleItems.forEach(item => {
            // item is SaleItem. Has 'description', 'type'.
            if (!productCounts[item.description]) {
                productCounts[item.description] = {
                    name: item.description,
                    count: 0,
                    type: item.type
                };
            }
            productCounts[item.description].count++;
        });
    });

    // Sort by frequency
    const topProducts = Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 used items

    return {
        topProducts
    };
}
