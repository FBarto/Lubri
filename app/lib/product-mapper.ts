
/**
 * Utility to map legacy service item descriptions or codes to modern product codes.
 */
export function mapLegacyProductCode(legacyDescription: string, category?: string): string | null {
    if (!legacyDescription) return null;

    // 0. Strip leading/trailing liter/quantity patterns (e.g. "3.5L ", "4 ", "F50  3")
    let clean = legacyDescription.trim().toUpperCase();

    // Remove leading quantity: "3.5 ", "4L ", "3,5 LTS "
    clean = clean.replace(/^(\d+([.,]\d+)?)\s*(L|LTS|LTS\.)?\s+/i, '');

    // Remove trailing quantity if it's a small number typically representing liters: " F50 4"
    // Usually anything < 10 at the end of a string after a space is a liter count
    clean = clean.replace(/\s+([1-9]([.,]\d+)?)\s*(L|LTS|LTS\.)?$/i, '');

    // 0.5 Normalize shorthands (e.g. "Q 7000" -> "Q7000", "Q 5000" -> "Q5000")
    clean = clean.replace(/Q\s+(\d+)/i, 'Q$1');
    clean = clean.replace(/GULF\s*ULTRA/i, 'GULF');
    clean = clean.replace(/HX7X4LTS/i, 'HX7');

    // 1. Direct Hardcoded Mappings for shortcuts
    if (clean === 'S2' || clean === 'S2000') return 'S2'; // Mobil Super 2000

    // 2. SUELTO (Bulk Oil) Rules
    if (clean.includes('SUELTO') || clean.includes('SUEL')) {
        if (clean.includes('F30') || clean.includes('F30TO')) return 'ELAION-F30-SUELTO';
        if (clean.includes('F50')) return 'ELAION-F50-SUELTO';
        if (clean.includes('F10')) return 'ELAION-F10-SUELTO';
        if (clean.includes('CASTROL') || clean.includes('CAST')) return 'CASTROL-MAGNATEC-SUELTO';
        if (clean.includes('Q7000') || clean.includes('Q7')) return 'TOTAL-Q7000-SUELTO';
        if (clean.includes('Q5000') || clean.includes('Q5')) return 'TOTAL-Q5000-SUELTO';
        if (clean.includes('ELF')) return 'ELF-SEMI-SUELTO';
        if (clean.includes('HX7')) return 'SHELL-HX7-SUELTO';
        if (clean.includes('GULF')) return 'GULF-SINT-SUELTO';
        if (clean.includes('S2000') || clean.includes('S2')) return 'S2'; // Usually Mobil Suelto is S2 code
        if (clean.includes('25W60') || clean.includes('25/60')) return 'SUEL-25W60';
        if (clean.includes('1040') || clean.includes('10/40')) return 'ELAION-F30-SUELTO'; // Common fallback
    }

    // 3. Bottled Oil Shortcuts (Handles patterns like "4 F50", "3.5 Q7000", "SELENIA")
    if (clean.includes('F50')) return 'ELAION-F50-1L';
    if (clean.includes('Q7000') || clean.includes('TOTAL 7000') || clean.includes('Q7')) return 'TOTAL-Q7000-1L';
    if (clean.includes('Q5000') || clean.includes('TOTAL 5000') || clean.includes('Q5')) return 'TOTAL-Q5000-1L';
    if (clean.includes('Q9000') || clean.includes('TOTAL 9000') || clean.includes('Q9')) return 'TOTAL-Q9000-1L';
    if (clean.includes('CASTROL') || clean.includes('CAST')) return 'CASTROL-MAGNATEC-1L';
    if (clean.includes('F30')) return 'ELAION-F30-1L';
    if (clean.includes('F10')) return 'ELAION-F10-1L';
    if (clean.includes('GULF 0/20') || clean.includes('GULF 0-20') || clean.includes('GULF0W20') || clean.includes('GULF')) return 'GULF-0W20';
    if (clean.includes('SELE') || clean.includes('SELENIA')) return 'SHELL-HX7-1L'; // Mapping Selenia to HX7 as fallback/alternative if common
    if (clean.includes('EVO')) return 'ELAION-AURO-1L'; // Mapping Evo to Auro (common in YPF)

    // 2. Numerical Filter Rules
    // Check if it's just a number or a simple code
    const isPureNumber = /^\d+$/.test(clean.replace(/\s/g, ''));
    if (isPureNumber) {
        const num = clean.replace(/\D/g, '');
        if (category === 'OIL_FILTER') return `MAP-${num}`;
        if (category === 'AIR_FILTER') return `AMPI-${num}`;
        if (category === 'CABIN_FILTER') return `HM-${num}`;
    }

    // 3. Fuel Filter Transformation (f10230 -> G10230, G 10230 -> G10230)
    if (clean.includes('10230')) return 'G10230';
    if (clean.includes('7729')) return 'G7729';

    if (clean.startsWith('F') && /^\d+$/.test(clean.substring(1))) {
        if (category === 'FUEL_FILTER') return `G${clean.substring(1)}`;
    }

    // 4. Case-insensitive standard code match (e.g. "AMBI 1154" -> "AMPI-1154" normalize)
    if (clean.includes('AMPI') || (clean.startsWith('AMP') && !clean.includes('AMP-'))) {
        const num = clean.replace(/\D/g, '');
        if (num) {
            // Check if it's a known tubular AMP filter
            const tubularCodes = ['163', '189'];
            if (tubularCodes.includes(num)) return `AMP-${num}`;
            return `AMPI-${num}`;
        }
    }
    if (clean.includes('MAP')) {
        const num = clean.replace(/\D/g, '');
        if (num) return `MAP-${num}`;
    }
    if (clean.includes('HM')) {
        const num = clean.replace(/\D/g, '');
        if (num) return `HM-${num}`;
    }
    if (clean.startsWith('ECO')) {
        const num = clean.replace(/\D/g, '');
        if (num) {
            if (category === 'FUEL_FILTER' || clean.includes('GS')) return `G${num}`;
            if (category === 'OIL_FILTER') return `MAP-${num}`;
            if (category === 'AIR_FILTER') return `AMPI-${num}`;
            if (category === 'CABIN_FILTER') return `HM-${num}`;
            return `MAP-${num}`; // Default for ECO if unknown
        }
    }

    return null;
}
