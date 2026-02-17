const fs = require('fs');
const path = require('path');

// WARNING: This script is only for LOCAL SQLite development databases.
// It does NOT work for production PostgreSQL databases (Neon, Vercel, etc).

console.error('❌ ERROR CRÍTICO DE SEGURIDAD');
console.error('Este script de backup (.sqlite) NO es compatible con la base de datos de producción (PostgreSQL).');
console.error('Si estás en producción (Neon), usa la consola de Neon para crear backups/snapshots.');
console.error('Para evitar pérdida de datos o falsa sensación de seguridad, este script ha sido deshabilitado.');

process.exit(1);
