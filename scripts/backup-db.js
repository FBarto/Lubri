const fs = require('fs');
const path = require('path');

const SOURCE_DB = path.join(__dirname, '..', 'prisma', 'dev.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const DEST_DB = path.join(BACKUP_DIR, `backup-${timestamp}.db`);

console.log(`📦 Iniciando backup de la base de datos...`);
console.log(`Origen: ${SOURCE_DB}`);

try {
    if (fs.existsSync(SOURCE_DB)) {
        fs.copyFileSync(SOURCE_DB, DEST_DB);
        console.log(`✅ Backup creado exitosamente: ${DEST_DB}`);
    } else {
        console.error(`❌ Error: No se encontró la base de datos en ${SOURCE_DB}`);
        process.exit(1);
    }
} catch (error) {
    console.error(`❌ Error al crear backup:`, error);
    process.exit(1);
}
