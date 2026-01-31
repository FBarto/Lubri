
const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '../../Base de datos anterior/MASTERFILT-CLIENTES-2025-10-06-2.xls');

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: "" });

    const searchTerms = ['1117', '1108', '3033', '2020', '213'];

    console.log("Searching Excel rows for terms:", searchTerms);

    data.forEach((row, index) => {
        const code = String(row[0]).toUpperCase();
        const desc = String(row[5]).toUpperCase();

        const found = searchTerms.some(term => code.includes(term) || desc.includes(term));

        if (found) {
            // Log row number and details
            console.log(`Row ${index}: Code='${row[0]}' | Desc='${row[5]}' | Price='${row[9]}'`);
        }
    });

} catch (error) {
    console.error("Error reading Excel file:", error);
}
