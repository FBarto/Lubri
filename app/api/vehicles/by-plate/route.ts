
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Assuming this is where prisma client is

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const plate = searchParams.get("plate");

    if (!plate) {
        return NextResponse.json({ error: "Plate is required" }, { status: 400 });
    }

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { plate: plate.toUpperCase() },
            include: {
                client: true,
                workOrders: {
                    take: 5,
                    orderBy: { date: 'desc' },
                    include: {
                        service: true,
                        saleItems: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            },
        });

        if (!vehicle) {
            return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
        }

        return NextResponse.json(vehicle);
    } catch (error) {
        console.error("Error fetching vehicle:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
