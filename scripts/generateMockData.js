const fs = require('fs');
const path = require('path');

// --- CONFIGURACIÓN ---
const COUNTS = {
    AGENTS: 5,
    OWNERS: 35,
    COLLEAGUES: 13,
    PROPERTIES: 50 // 25 propias + 25 colegas
};

const OUTPUT_DIR = path.join(__dirname, '../backend/utils/seedData');

// --- DATOS BASE PARA MEZCLAR ---
const names = ["Carlos", "Mariana", "Juan", "Sofia", "Miguel", "Lucia", "Roberto", "Ana", "Diego", "Valentina", "Pedro", "Elena"];
const lastNames = ["Gomez", "Perez", "Rodriguez", "Fernandez", "Lopez", "Diaz", "Martinez", "Sánchez", "Romero", "Alvarez"];
const localities = ["Berazategui", "Quilmes", "Hudson", "El Pato", "Ranelagh", "Bernal"];
const types = ["vivienda", "lote", "industrial", "comercial"];
const currencies = ["USD", "ARS"];
const imagesPool = [
    "https://images.unsplash.com/photo-1600596542815-e36cb29fb927?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80" // Industrial
];

// --- HELPERS ---
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getPhone = () => `11${randomInt(10000000, 99999999)}`;
const getSubtype = (type) => {
    switch (type) {
        case 'vivienda': return random(['casa', 'departamento', 'ph']); // Variedad
        case 'lote': return 'terreno';
        case 'industrial': return 'nave_industrial'; // Ahora sí sale bien
        case 'comercial': return 'local';
        default: return 'otro';
    }
};

// --- GENERADORES ---

function generateAgents() {
    const agents = [];
    for (let i = 1; i <= COUNTS.AGENTS; i++) {
        agents.push({
            id: i, // Forzamos ID para relacionar fácil
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
    
    // Generamos 50 propiedades
    for (let i = 1; i <= COUNTS.PROPERTIES; i++) {
        const isPropia = i <= 25; // Las primeras 25 son propias
        const type = random(types);
        const subtype = getSubtype(type);
        const locality = random(localities);
        const currency = random(currencies); // USD o ARS

        let price = randomInt(50000, 500000);
        if (currency === 'ARS') price = price * 1000; // Ajuste burdo de cambio

        const property = {
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} en ${locality} - Oportunidad`,
            description: "Propiedad generada para pruebas de carga y visualización en el portfolio.",
            price: price,
            currency: currency,
            type: type,
            subtype: subtype,
            category: Math.random() > 0.5 ? 'venta' : 'alquiler',
            locality: locality,
            neighbourhood: "Centro",
            address: `Calle ${randomInt(1, 100)} Nº ${randomInt(100, 5000)}`,
            totalSurface: randomInt(200, 1000),
            coveredSurface: randomInt(50, 300),
            isPublished: true,
            
            // Lógica de Asignación
            propertySource: isPropia ? 'propia' : 'colega',
            
            // Asignamos IDs aleatorios dentro de los rangos que generamos antes
            ownerId: isPropia ? randomInt(1, COUNTS.OWNERS) : null,
            agentId: isPropia ? randomInt(1, COUNTS.AGENTS) : null,
            colleagueId: !isPropia ? randomInt(1, COUNTS.COLLEAGUES) : null,
            
            images: [random(imagesPool), random(imagesPool)], // 2 fotos al azar
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

console.log(`Archivos JSON generados en ${OUTPUT_DIR}`);