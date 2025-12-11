// scripts/generateMockData.js
const fs = require('fs');
const path = require('path');

// --- CONFIGURACIÓN ---
const COUNTS = {
    AGENTS: 5,
    OWNERS: 35,
    COLLEAGUES: 13,
    PROPERTIES: 50
};

const OUTPUT_DIR = path.join(__dirname, '../backend/utils/seedData');

// --- DATOS BASE ---
const names = ["Carlos", "Mariana", "Juan", "Sofia", "Miguel", "Lucia", "Roberto", "Ana", "Diego", "Valentina"];
const lastNames = ["Gomez", "Perez", "Rodriguez", "Fernandez", "Lopez", "Diaz", "Martinez", "Sánchez", "Romero"];
const currencies = ["USD", "ARS"];

// 1. DICCIONARIO DE UBICACIONES (Corredor Sur - Coordenadas Reales)
const locations = [
    { name: "Berazategui", lat: -34.763, lng: -58.211 },
    { name: "Quilmes", lat: -34.724, lng: -58.252 },
    { name: "Hudson", lat: -34.795, lng: -58.153 },
    { name: "El Pato", lat: -34.868, lng: -58.181 },
    { name: "Ranelagh", lat: -34.789, lng: -58.201 },
    { name: "Bernal", lat: -34.708, lng: -58.283 },
    { name: "La Plata", lat: -34.921, lng: -57.954 },
    { name: "City Bell", lat: -34.871, lng: -58.053 }
];

// 2. DICCIONARIO DE IMÁGENES POR TIPO (Visualmente coherentes)
const imagePools = {
    vivienda: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800", 
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800", 
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800"  
    ],
    lote: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800",
        "https://images.unsplash.com/photo-1591389703635-e15a07b842d7?q=80&w=800", 
        "https://images.unsplash.com/photo-1629016943072-0bf0ce4e2608?q=80&w=800"  
    ],
    industrial: [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800", 
        "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=800",    
        "https://images.unsplash.com/photo-1684695749267-233af13276d0?q=80&w=800"  
    ],
    comercial: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800", 
        "https://images.unsplash.com/photo-1533922922960-9fceb9ef4733?q=80&w=800",  
        "https://images.unsplash.com/photo-1564419965579-5da68ffdf3af?q=80&w=800"  
    ]
};

// --- HELPERS ---
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getPhone = () => `11${randomInt(10000000, 99999999)}`;

const getSubtype = (type) => {
    switch (type) {
        case 'vivienda': return random(['casa', 'departamento', 'ph']);
        case 'lote': return 'terreno';
        case 'industrial': return random(['nave_industrial', 'galpon']);
        case 'comercial': return random(['local', 'oficina']);
        default: return 'otro';
    }
};

// Generador de coordenadas cercanas a un punto base (dispersión de ~1km)
const getNearbyCoords = (baseLat, baseLng) => {
    const jitter = 0.015; // Ajustar para más o menos dispersión
    return {
        lat: baseLat + (Math.random() - 0.5) * jitter,
        lng: baseLng + (Math.random() - 0.5) * jitter
    };
};

// --- GENERADORES ---

function generateAgents() {
    const agents = [];
    for (let i = 1; i <= COUNTS.AGENTS; i++) {
        agents.push({
            id: i,
            fullName: `Agente ${random(names)} ${random(lastNames)}`,
            phoneNumber: getPhone(),
            email: `agente${i}@inmo.com`
        });
    }
    return agents;
}

function generateOwners() {
    const owners = [];
    for (let i = 1; i <= COUNTS.OWNERS; i++) {
        owners.push({
            id: i,
            fullName: `${random(names)} ${random(lastNames)}`,
            phoneNumber: getPhone(),
            email: `propietario${i}@mail.com`,
            privateNotes: "Cliente generado automáticamente."
        });
    }
    return owners;
}

function generateColleagues() {
    const cols = [];
    for (let i = 1; i <= COUNTS.COLLEAGUES; i++) {
        cols.push({
            id: i,
            fullName: `${random(names)} ${random(lastNames)}`,
            agencyName: `Inmobiliaria ${random(names)}`,
            phoneNumber: getPhone()
        });
    }
    return cols;
}

function generateProperties() {
    const props = [];
    const typesKeys = Object.keys(imagePools); // ['vivienda', 'lote', 'industrial', 'comercial']

    for (let i = 1; i <= COUNTS.PROPERTIES; i++) {
        const isPropia = i <= 25; 
        
        // 1. Elegimos datos coherentes
        const type = random(typesKeys); 
        const subtype = getSubtype(type);
        const locationData = random(locations); // Elige una ciudad del corredor Sur
        const coords = getNearbyCoords(locationData.lat, locationData.lng); // Genera lat/lng reales
        const currency = random(currencies);
        const imgPool = imagePools[type]; // Fotos específicas del tipo

        // 2. Precio inteligente
        let price = randomInt(50000, 500000);
        if (type === 'lote') price = randomInt(20000, 80000);
        if (currency === 'ARS') price = price * 1100; 

        // 3. Objeto Propiedad
        const property = {
            name: `${subtype.charAt(0).toUpperCase() + subtype.slice(1)} en ${locationData.name} - Oportunidad`,
            description: "Propiedad estratégicamente ubicada en el corredor sur. Ideal para inversión o vivienda permanente. Documentación al día.",
            price: price,
            currency: currency,
            type: type,
            subtype: subtype,
            category: Math.random() > 0.5 ? 'venta' : 'alquiler',
            
            // Ubicación Real
            locality: locationData.name,
            neighbourhood: "Centro",
            address: `Calle ${randomInt(1, 100)} Nº ${randomInt(100, 5000)}`,
            latitude: coords.lat,
            longitude: coords.lng,

            totalSurface: randomInt(200, 1000),
            coveredSurface: randomInt(50, 300),
            isPublished: true,
            
            propertySource: isPropia ? 'propia' : 'colega', // 'propia' ajustado
            
            ownerId: isPropia ? randomInt(1, COUNTS.OWNERS) : null,
            agentId: isPropia ? randomInt(1, COUNTS.AGENTS) : null,
            colleagueId: !isPropia ? randomInt(1, COUNTS.COLLEAGUES) : null,
            
            // Elegimos 2 fotos aleatorias del pool CORRECTO
            images: [random(imgPool), random(imgPool)],
            
            specificCharacteristics: { ambientes: randomInt(2, 5), banos: randomInt(1, 3) }
        };
        props.push(property);
    }
    return props;
}

// --- EJECUCIÓN ---
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'agents.json'), JSON.stringify(generateAgents(), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'owners.json'), JSON.stringify(generateOwners(), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'colleagues.json'), JSON.stringify(generateColleagues(), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'properties.json'), JSON.stringify(generateProperties(), null, 2));

console.log(`✅ Archivos JSON generados en ${OUTPUT_DIR} con Coordenadas y Fotos correctas.`);