import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        // Fetch Products
        const productWhere: any = { active: true };
        if (category && category !== 'Servicios') { // 'Servicios' is a virtual category for the grid
            productWhere.category = category;
        }

        // Fetch Services
        // We only fetch services if category is empty or explicitly 'Servicios'
        // OR if we want to show everything. 
        // Strategy: 
        // if category is present and NOT 'Servicios', fetch only matching products.
        // if category is 'Servicios', fetch only services.
        // if category is empty (ALL), fetch everything.

        let products: any[] = [];
        let services: any[] = [];

        if (!category || category !== 'Servicios') {
            products = await prisma.product.findMany({
                where: productWhere,
                orderBy: { name: 'asc' }
            });
        }

        if (!category || category === 'Servicios') {
            services = await prisma.service.findMany({
                where: { active: true },
                orderBy: { name: 'asc' }
            });
        }

        // Standardize output
        const mappedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            type: 'PRODUCT'
        }));

        const mappedServices = services.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price,
            category: 'Servicios', // Force category for grid grouping
            type: 'SERVICE'
        }));

        return NextResponse.json([...mappedServices, ...mappedProducts]); // Services first usually better or mixed? Mixed alpha? Let's just concat.
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
