export interface MaintenanceStatus {
    label: string;
    lastDate: Date | null;
    lastMileage: number | null;
    status: 'OK' | 'WARNING' | 'DANGER' | 'UNKNOWN';
    daysAgo: number | null;
}

export const MAINTENANCE_ITEMS = {
    filters: [
        { key: 'oil_filter', label: 'Filtro Aceite', keywords: ['filtro aceite', 'filtro de aceite', 'unidad sellada', 'full service', 'service completo', '"oil":'] },
        { key: 'air_filter', label: 'Filtro Aire', keywords: ['filtro aire', 'filtro de aire', '"air":'] },
        { key: 'fuel_filter', label: 'Filtro Combustible', keywords: ['filtro combustible', 'filtro de combustible', 'filtro nafta', 'filtro de nafta', 'filtro gasoil', 'filtro de gasoil', '"fuel":', '"nafta":', '"gasoil":'] },
        { key: 'cabin_filter', label: 'Filtro Habitáculo', keywords: ['filtro habitaculo', 'filtro de habitaculo', 'filtro polen', 'filtro de polen', 'filtro aire acondicionado', '"cabin":', '"habitaculo":'] },
    ],
    fluids: [
        { key: 'engine_oil', label: 'Aceite Motor', keywords: ['aceite motor', 'aceite de motor', 'cambio de aceite', 'full service', 'service completo', 'full flow oil', 'full synthetic', 'semi synthetic', 'mineral oil', 'aceite 10w40', 'aceite 5w30', 'aceite 5w40', 'aceite 15w40', 'aceite 0w20', 'aceite 20w50', '5w30', '5w40', '10w40', '0w20', '15w40', '20w50', 'mobil', 'elaion', 'shell', 'helix', 'valvoline', 'castrol', 'total', 'motul', 'petronas', 'liqui moly', 'gulf', 'ypf', 'lubricante', '"oil":'] },
        { key: 'coolant', label: 'Refrigerante', keywords: ['refrigerante', 'anticongelante', 'agua destilada', '"refrigerante":'] },
        { key: 'brake_fluid', label: 'Líquido Frenos', keywords: ['liquido freno', 'liquido de freno', 'liquido frenos', 'liquido de frenos', '"frenos":'] },
        { key: 'gearbox_oil', label: 'Aceite Caja', keywords: ['aceite caja', 'aceite de caja', 'valvulina', 'transmision', '"caja":'] },
    ],
    services: [
        { key: 'tyres', label: 'Cubiertas', keywords: ['cubierta', 'neumatico', 'llanta', 'goma', 'cubiertas'] },
        { key: 'tire_rotation', label: 'Rotación', keywords: ['rotacion', 'alineacion', 'balanceo'] },
        { key: 'wipers', label: 'Escobillas', keywords: ['escobilla', 'limpiaparabrisas', 'escobillas'] },
        { key: 'battery', label: 'Batería', keywords: ['bateria', 'bateria'] },
    ]
};
