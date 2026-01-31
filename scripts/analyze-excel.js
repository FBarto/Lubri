
const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '../../Base de datos anterior/MASTERFILT-CLIENTES-2025-10-06-2.xls');

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read first 10 rows to understand the structure
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: "" });

    console.log("Sheet Name:", sheetName);
    console.log("First 10 rows:");
    console.log(data.slice(0, 10));

} catch (error) {
    console.error("Error reading Excel file:", error);
}
