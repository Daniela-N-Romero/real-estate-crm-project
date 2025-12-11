// scripts/seedDatabase.js
const { sequelize, User, Agent, Owner, Property, Colleague } = require('../backend/config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Helper para cargar los JSON que generaste
const loadJSON = (fileName) => {
    const filePath = path.join(__dirname, '../backend/utils/seedData', fileName);
    // Leemos el archivo y lo convertimos de texto a objeto JS
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const seed = async () => {
    console.log("> INICIANDO POBLADO DE BASE DE DATOS (SEEDING)...");
    
    try {
        // 1. LIMPIEZA TOTAL (¡Cuidado en producción!)
        await sequelize.sync({ force: true });
        console.log(">  Base de datos limpiada y sincronizada.");

        // 2. CREAR ADMIN (Este siempre fijo)
        const password = await bcrypt.hash('admin123', 10);
        await User.create({
            username: 'admin', 
            email: 'demo@admin.com',
            password: password,
            role: 'admin'
        });
        console.log("> Admin creado: demo@admin.com");

        // 3. CARGAR DATOS MASIVOS DESDE JSON
        // Leemos los archivos que creó generateMockData.js
        const agentsData = loadJSON('agents.json');
        const ownersData = loadJSON('owners.json');
        const colleaguesData = loadJSON('colleagues.json');
        const propertiesData = loadJSON('properties.json');

        // 4. INSERTAR DATOS
        await Agent.bulkCreate(agentsData);
        console.log(`> ${agentsData.length} Agentes insertados.`);

        await Owner.bulkCreate(ownersData);
        console.log(`> ${ownersData.length} Propietarios insertados.`);

        await Colleague.bulkCreate(colleaguesData);
        console.log(`> ${colleaguesData.length} Colegas insertados.`);

        // 5. INSERTAR PROPIEDADES
        await Property.bulkCreate(propertiesData);
        console.log(`> ${propertiesData.length} Propiedades insertadas.`);

        console.log("> ¡SEED COMPLETO! Base de datos lista.");

    } catch (error) {
        console.error("> Error fatal en el Seeding:", error);
    } finally {
        await sequelize.close(); // Cerramos conexión para que el script termine
    }
};

seed();