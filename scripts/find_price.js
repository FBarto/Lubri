
const fs = require('fs');
const path = require('path');

const articulosPath = path.join(__dirname, '../../Base de datos anterior/articulos.sql');

try {
    const content = fs.readFileSync(articulosPath, 'utf8');
    const lines = content.split('\n');

    console.log("Searching for '203' in articulos.sql...");

    lines.forEach(line => {
        if (line.includes('203')) {
            // Simple heuristic to filter relevant INSERT lines
            if (line.includes('INSERT INTO') || line.includes('VALUES') || line.trim().startsWith('(')) {
                // Look for MAP or AMP (since user mentioned clarify, but we check both just in case)
                // Also check for just '203' if it's a stand-alone code
                const upperLine = line.toUpperCase();
                if (upperLine.includes("'MAP 203'") || upperLine.includes("'AMP 203'") || upperLine.includes("'203'")) {
                    console.log(line.trim());
                }
            }
        }
    });

} catch (error) {
    console.error("Error reading file:", error);
}
