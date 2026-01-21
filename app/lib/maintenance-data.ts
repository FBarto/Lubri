export interface MaintenanceStatus {
    label: string;
    lastDate: Date | null;
    lastMileage: number | null;
    status: 'OK' | 'WARNING' | 'DANGER' | 'UNKNOWN';
    daysAgo: number | null;
}

export const MAINTENANCE_ITEMS = {
    filters: [
        { key: 'oil_filter', label: 'Filtro Aceite', keywords: ['filtro aceite', 'unidad sellada', '"oil":'] },
        { key: 'air_filter', label: 'Filtro Aire', keywords: ['filtro aire', '"air":'] },
        { key: 'fuel_filter', label: 'Filtro Combustible', keywords: ['filtro combustible', 'filtro nafta', 'filtro gasoil', '"fuel":', '"nafta":', '"gasoil":'] },
        { key: 'cabin_filter', label: 'Filtro Habitáculo', keywords: ['filtro habitaculo', 'filtro polen', 'filtro aire acondicionado', '"cabin":', '"habitaculo":'] },
    ],
    fluids: [
        { key: 'engine_oil', label: 'Aceite Motor', keywords: ['aceite motor', 'aceite 10w40', 'aceite 5w30', 'aceite 15w40', 'cambio de aceite', 'mobil', 'elaion', 'shell helix', 'valvoline', 'castrol', 'total', '"oil":'] },
        { key: 'coolant', label: 'Refrigerante', keywords: ['refrigerante', 'anticongelante', 'agua destilada', '"refrigerante":'] },
        { key: 'brake_fluid', label: 'Líquido Frenos', keywords: ['liquido freno', 'liquido de freno', '"frenos":'] },
        { key: 'gearbox_oil', label: 'Aceite Caja', keywords: ['aceite caja', 'valvulina', 'transmision', '"caja":'] },
    ],
    services: [
        { key: 'tyres', label: 'Cubiertas', keywords: ['cubierta', 'neumatico', 'llanta', 'goma', 'cubiertas'] },
        { key: 'tire_rotation', label: 'Rotación', keywords: ['rotacion', 'alineacion', 'balanceo'] },
        { key: 'wipers', label: 'Escobillas', keywords: ['escobilla', 'limpiaparabrisas', 'escobillas'] },
        { key: 'battery', label: 'Batería', keywords: ['bateria', 'bateria'] },
    ]
};
