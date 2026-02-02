
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type EstimateItem = {
    productId?: number; // Internal ID for logic
    description: string;
    code?: string;
    quantity: number;
    unitPrice: number;
    stockAvailable?: number;
    status: "OK" | "OOS" | "MANUAL";
    autoSuggested: boolean;
};

export async function POST(request: Request) {
    const body = await request.json();
    const { vehicleId, preset } = body; // preset: "SMALL" | "FULL"

    if (!vehicleId) {
        return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 });
    }

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: parseInt(vehicleId) },
            include: {
                workOrders: {
                    orderBy: { date: 'desc' },
                    take: 5, // Check last few to find a valid service
                    include: {
                        saleItems: {
                            include: { product: true }
                        }
                    }
                }
            }
        });

        if (!vehicle) {
            return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
        }

        const specs = (vehicle.specifications as any) || {};
        const learned = specs.learned || {};

        // 1. Determine Product IDs from Learned Data or History
        let oilProductId = learned.oilProductId;
        let oilFilterProductId = learned.oilFilterProductId;
        let airFilterProductId = learned.airFilterProductId;
        let cabinFilterProductId = learned.cabinFilterProductId;
        let fuelFilterProductId = learned.fuelFilterProductId;
        let oilTypicalLiters = learned.oilTypicalLiters;

        // If missing learned data, try to infer from last valid WO
        if (!oilProductId || !oilFilterProductId) {
            for (const wo of vehicle.workOrders) {
                // Simplistic inference: check items with "Aceite" or filter categories
                // This logic might need to be more robust based on Product.category
                const oilItem = wo.saleItems.find(i => i.description.toLowerCase().includes("aceite") || i.product?.category === "LUBRICANTES");
                const filterOilItem = wo.saleItems.find(i => i.description.toLowerCase().includes("filtro aceite") || i.product?.category === "FILTROS");

                if (oilItem && !oilProductId) oilProductId = oilItem.productId;
                if (filterOilItem && !oilFilterProductId) oilFilterProductId = filterOilItem.productId;

                // Try to catch split oil (bulk + bottle)
                // This is complex to do purely from history without explicit flags, we'll implement a basic check
                // If we found a WO with oil, we stop "inferring" generally, but we can look for other filters there too
                if (oilItem) {
                    // Try to find other filters in the same WO
                    if (!airFilterProductId) airFilterProductId = wo.saleItems.find(i => i.description.toLowerCase().includes("filtro aire"))?.productId;
                    if (!cabinFilterProductId) cabinFilterProductId = wo.saleItems.find(i => i.description.toLowerCase().includes("filtro habitaculo"))?.productId;
                    if (!fuelFilterProductId) fuelFilterProductId = wo.saleItems.find(i => i.description.toLowerCase().includes("filtro combustible"))?.productId;

                    // Liters logic
                    if (!oilTypicalLiters) {
                        oilTypicalLiters = wo.saleItems
                            .filter(i => i.description.toLowerCase().includes("aceite") || i.product?.category === "LUBRICANTES")
                            .reduce((acc, curr) => acc + Number(curr.quantity), 0);
                    }
                    break;
                }
            }
        }

        // 2. Build Suggestion List
        const suggestedItems: EstimateItem[] = [];
        const productIdsToFetch = [oilProductId, oilFilterProductId];

        if (preset === "FULL") {
            if (airFilterProductId) productIdsToFetch.push(airFilterProductId);
            if (cabinFilterProductId) productIdsToFetch.push(cabinFilterProductId);
            if (fuelFilterProductId) productIdsToFetch.push(fuelFilterProductId);
        }

        // Filter out undefined/nulls
        const validIds = productIdsToFetch.filter(id => !!id) as number[];

        // Fetch current Product data for these IDs (to get live Price and Stock)
        const products = await prisma.product.findMany({
            where: { id: { in: validIds } }
        });

        const productMap = new Map(products.map(p => [p.id, p]));

        // Construct Items
        // Oil
        if (oilProductId) {
            const p = productMap.get(oilProductId);
            if (p) {
                suggestedItems.push({
                    productId: p.id,
                    description: p.name,
                    code: p.code || "",
                    quantity: oilTypicalLiters || 4, // Default to 4 if unknown
                    unitPrice: p.price,
                    stockAvailable: p.stock,
                    status: p.stock > (oilTypicalLiters || 4) ? "OK" : "OOS",
                    autoSuggested: true
                });
            }
        } else {
            // Manual Oil Item placeholder if we know nothing
            suggestedItems.push({
                description: "Aceite (No identificado)",
                quantity: 4,
                unitPrice: 0,
                status: "MANUAL",
                autoSuggested: true
            });
        }

        // Oil Filter
        if (oilFilterProductId) {
            const p = productMap.get(oilFilterProductId);
            if (p) {
                suggestedItems.push({
                    productId: p.id,
                    description: p.name,
                    code: p.code || "",
                    quantity: 1,
                    unitPrice: p.price,
                    stockAvailable: p.stock,
                    status: p.stock >= 1 ? "OK" : "OOS",
                    autoSuggested: true
                });
            }
        } else {
            suggestedItems.push({
                description: "Filtro de Aceite (No identificado)",
                quantity: 1,
                unitPrice: 0,
                status: "MANUAL",
                autoSuggested: true
            });
        }

        // Add others if FULL
        if (preset === "FULL") {
            const addFilter = (pid: number | undefined, name: string) => {
                if (pid) {
                    const p = productMap.get(pid);
                    if (p) {
                        suggestedItems.push({
                            productId: p.id,
                            description: p.name,
                            code: p.code || "",
                            quantity: 1,
                            unitPrice: p.price,
                            stockAvailable: p.stock,
                            status: p.stock >= 1 ? "OK" : "OOS",
                            autoSuggested: true
                        });
                    }
                } else {
                    suggestedItems.push({
                        description: `${name} (No identificado)`,
                        quantity: 1,
                        unitPrice: 0,
                        status: "MANUAL",
                        autoSuggested: true
                    });
                }
            };

            addFilter(airFilterProductId, "Filtro de Aire");
            // Optional ones, maybe don't add "Manual" placeholder if not found in history, to avoid clutter? 
            // User asked: "si no existe, se aprende del último WorkOrder “válido”". If never valid, maybe verify if we should suggest empty.
            // For now, let's suggest empty manual slot if it's a "FULL" service request, to remind the user to check it.
            addFilter(cabinFilterProductId, "Filtro Habitáculo");
            addFilter(fuelFilterProductId, "Filtro Combustible");
        }

        return NextResponse.json({
            suggestedItems,
            learnedData: {
                oilProductId,
                oilFilterProductId,
                airFilterProductId,
                cabinFilterProductId,
                fuelFilterProductId,
                oilTypicalLiters
            }
        });

    } catch (error) {
        console.error("Error generating estimate:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
