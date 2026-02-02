
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Correct way to handle params in Next.js 15
) {
    const { id } = await params;
    const body = await request.json();
    const { learned } = body; // Expecting { learned: { ... } }

    if (!id || !learned) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    try {
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Fetch current specs to merge, though we might just want to upsert the 'learned' key
        const currentVehicle = await prisma.vehicle.findUnique({
            where: { id: numericId },
            select: { specifications: true }
        });

        if (!currentVehicle) {
            return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
        }

        // Merge existing specs with new learned data
        // Prisma Json type needs careful handling for deep merges if we want to preserve other keys
        const currentSpecs = (currentVehicle.specifications as Record<string, any>) || {};
        const newSpecs = {
            ...currentSpecs,
            learned: {
                ...(currentSpecs.learned || {}),
                ...learned,
                updatedAt: new Date().toISOString()
            }
        };

        const updatedVehicle = await prisma.vehicle.update({
            where: { id: numericId },
            data: {
                specifications: newSpecs,
            },
        });

        return NextResponse.json(updatedVehicle);
    } catch (error) {
        console.error("Error saving learned specs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
