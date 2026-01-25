
import { prisma } from '../lib/prisma';

async function debugAbel() {
    const plate = "AD389JK";
    console.log(`Checking plate: ${plate}`);

    const vehicle = await prisma.vehicle.findUnique({
        where: { plate }
    });

    if (vehicle) {
        console.log(`✅ Vehicle found: ID ${vehicle.id}, ClientID ${vehicle.clientId}`);
    } else {
        console.log("❌ Vehicle NOT found in DB.");
    }

    // Check srerice.sql parsing for this plate
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync('C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/srerice.sql', 'utf-8');

    // Simple regex to find lines with the plate
    const regex = new RegExp(`\\('(\\d+)',\\s*'${plate}'`, 'g');
    let match;
    console.log("\nMatches in SQL file:");
    while ((match = regex.exec(content)) !== null) {
        console.log(`Found: ${match[0]}`);
    }
}

debugAbel().catch(console.error);
