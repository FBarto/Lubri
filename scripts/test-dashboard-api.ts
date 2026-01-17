
import { GET } from '../app/api/reports/dashboard/route';

async function main() {
    console.log('Testing Dashboard API Logic...');

    // Mock Request object if needed (GET doesn't use it currently)
    const response = await GET();
    const data = await response.json();

    console.log('API Response Status:', response.status);

    if (response.status === 200) {
        console.log('KPIs:', data.kpi);
        console.log('Chart Data Points:', data.chart.length);
        if (data.chart.length > 0) {
            console.log('Sample Chart Data:', data.chart[0]);
        }
        console.log('Top Products:', data.topProducts.length);
        if (data.topProducts.length > 0) {
            console.log('Sample Top Product:', data.topProducts[0]);
        }
    } else {
        console.error('Error:', data);
    }
}

main().catch(console.error);
