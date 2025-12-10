const { sequelize, User, Agent, Owner, Property, Colleague } = require('../backend/config/database');
const bcrypt = require('bcryptjs');

const seed = async () => {
    console.log("INICIANDO POBLADO DE BASE DE DATOS (SEEDING)");
    
    try {
        // 1. REINICIAR BASE DE DATOS
        // Usamos { force: true } para arrancar de cero.
        await sequelize.sync({ force: true });
        console.log("> Base de datos limpiada y sincronizada.");

        // 2. CREAR USUARIO ADMIN
        const password = await bcrypt.hash('admin123', 10);

        await User.create({
            username: 'Administrador', 
            email: 'demo@admin.com',
            password: password,
            role: 'admin'
        });
        console.log("> Admin creado: Administrador");

        // 3. CREAR AGENTES
        const agent1 = await Agent.create({ 
            fullName: "Agente Demo", 
            phoneNumber: "1111111111",
            email: "agente@demo.com"
        });
        console.log("> Agente creado: Agente Demo");

        // 4. CREAR PROPIETARIO FICTICIO
        const owner1 = await Owner.create({
            fullName: "Juan Propietario",
            phoneNumber: "2222222222",
            email: "propietario@test.com",
            privateNotes: "Vende por viaje. Motivado."
        });
        console.log("> Propietario creado: Juan Propietario");
        
        // 5. CREAR PROPIEDADES (Lo nuevo: Datos visuales para el demo)
        // Usamos fotos de Unsplash para no tener que subir archivos

        for (const prop of properties) {
            await Property.create(prop);
        }
        
        console.log(`> ${properties.length} Propiedades de prueba creadas.`);

    } catch (error) {
        console.error("❌ Error fatal en el Seeding:", error);
    } finally {
        await sequelize.close();
        console.log("👋 Conexión cerrada. Seeding finalizado.");
    }
};

seed();