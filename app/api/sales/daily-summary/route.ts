
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sales = await prisma.sale.findMany({
            where: {
                date: {
                    gte: today
                }
            },
            include: {
                user: {
                    select: { name: true, username: true } // Optional: showing who sold
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        // Aggregation Logic
        const summary = {
            totalSales: 0,
            count: sales.length,
            byMethod: {
                'CASH': 0,
                'CARD': 0,
                'TRANSFER': 0,
                'OTHER': 0
            },
            details: [] as any[]
        };

        sales.forEach(sale => {
            summary.totalSales += sale.total;

            // Parse Payment Method String
            // Format example: "CASH: $1,200 | CARD (Plan): $3,000"
            if (sale.paymentMethod) {
                const parts = sale.paymentMethod.split('|');
                parts.forEach(part => {
                    const trimmed = part.trim();
                    // Split by first occurrence of ':'
                    const colonIndex = trimmed.indexOf(':');
                    if (colonIndex === -1) return;

                    const methodPart = trimmed.substring(0, colonIndex).trim(); // "CASH" or "CARD (Plan)"
                    const amountPart = trimmed.substring(colonIndex + 1).trim(); // "$1,200"

                    // Clean amount string: remove '$', remove dots (thousands), replace comma with dot (decimal) if using AR locale, 
                    // BUT toLocaleString behaves differently based on server.
                    // Let's assume standard number parsing: Remove non-numeric except . and ,
                    // Safest approach: regex remove [^0-9,.-]

                    // Actually, since we stored it via toLocaleString(), it's messy to parse back without knowing locale.
                    // ALTERNATIVE: Use a heuristic.
                    // If we stored just one method, we can use sale.total.
                    // If mixed, we rely on the string.

                    // Let's interpret the amountStr. 
                    // usually "$1,200.50" -> 1200.50
                    // or "$1.200,50" -> 1200.50

                    let cleanAmount = amountPart.replace(/[^0-9,.-]/g, '');
                    // Heuristic: if it has a comma and a dot, the last one is decimal separator.
                    // If only comma, strict check.

                    // simplified cleaning: verify standard behavior of RestrictedPOS. 
                    // It uses default toLocaleString(). Node default is usually English (comma for thousands).
                    // Chrome/Browser default depends on user.

                    // Let's try standard parse.
                    let amount = 0;
                    if (cleanAmount.includes(',') && cleanAmount.includes('.')) {
                        // "1,200.50" (US) -> remove comma
                        if (cleanAmount.indexOf(',') < cleanAmount.indexOf('.')) {
                            amount = parseFloat(cleanAmount.replace(/,/g, ''));
                        } else {
                            // "1.200,50" (EU) -> remove dot, replace comma
                            amount = parseFloat(cleanAmount.replace(/\./g, '').replace(',', '.'));
                        }
                    } else if (cleanAmount.includes(',')) {
                        // Could be "1,200" (US) or "5,50" (EU decimal).
                        // If comma is followed by 3 digits, likely thousands (unless < 1000).
                        // Hard to guess. 
                        // fallback: replace comma with dot?
                        amount = parseFloat(cleanAmount.replace(',', '.'));
                    } else {
                        amount = parseFloat(cleanAmount);
                    }

                    if (isNaN(amount)) amount = 0;

                    // Classify Method
                    const upperMethod = methodPart.toUpperCase();
                    if (upperMethod.includes('CASH') || upperMethod.includes('EFECTIVO')) {
                        summary.byMethod['CASH'] += amount;
                    } else if (upperMethod.includes('CARD') || upperMethod.includes('TARJETA')) {
                        summary.byMethod['CARD'] += amount;
                    } else if (upperMethod.includes('TRANSFER')) {
                        summary.byMethod['TRANSFER'] += amount;
                    } else {
                        summary.byMethod['OTHER'] += amount;
                    }
                });
            } else {
                // No payment method string, assume Other = Total
                summary.byMethod['OTHER'] += sale.total;
            }

            summary.details.push({
                id: sale.id,
                time: sale.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                total: sale.total,
                method: sale.paymentMethod,
                user: sale.user?.username || '?'
            });
        });

        return NextResponse.json(summary);

    } catch (error) {
        console.error('Error calculating daily summary:', error);
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
