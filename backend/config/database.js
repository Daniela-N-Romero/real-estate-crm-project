// backend/config/database.js
const { Sequelize, DataTypes } = require("sequelize");
const dotenv = require("dotenv");

// Cargar variables de entorno si aún no lo están (útil si este archivo se ejecuta independientemente)
dotenv.config();

// Configuración de la conexión a la base de datos
let  sequelize 

if (process.env.DB_URL) {
    // Si hay URL completa (Producción/Neon), usamos esa
    sequelize = new Sequelize(process.env.DB_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false 
            }
        },
        logging: false
    });
} else {
    // Si no (Desarrollo local), usamos las variables sueltas
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            dialect: 'postgres',
            logging: console.log
        }
    );
}

// --- Definición de Modelos ---
// Modelo de Usuario (para el acceso al panel de administración)
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      // Aquí se almacenará el hash de la contraseña
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // Puedes hacerlo false si el email es obligatorio
      validate: {
        isEmail: true, // Valida que sea un formato de email válido
      },
    },
    role: {
      // Ejemplo de un rol para diferenciar tipos de usuarios (ej. 'admin', 'editor')
      type: DataTypes.STRING,
      defaultValue: "admin", // Por defecto, asignamos 'admin' para este proyecto
    },
    // Puedes añadir más campos como 'firstName', 'lastName', 'createdAt', 'updatedAt'
  },
  {
    tableName: "users", // Nombre real de la tabla en la DB
    timestamps: true, // Habilita createdAt y updatedAt automáticamente
  }
);

// Modelo de Propiedad
const Property = sequelize.define(
  "Property",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    locality: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    neighbourhood: { // Campo para el barrio / zona
      type: DataTypes.STRING,
      allowNull: true // Debe permitir nulos o tener un defaultValue si puede ir vacío
    },
    totalSurface: {
      // Superficie Total
      type: DataTypes.DECIMAL(10, 2), // Ejemplo: 12345.67
      allowNull: false,
    },
    coveredSurface: {
      // Superficie Cubierta
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    propertySource: { 
      // 'ms_propia' (Nuestra) o 'colega' (Externa)
      type: DataTypes.STRING,
      defaultValue: 'ms_propia', 
      allowNull: false
    },
    // FK para relacionar con el colega (será null si la propiedad es nuestra)
    colleagueId: { 
      type: DataTypes.INTEGER,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT, // Para texto largo
      allowNull: false,
    },
    type: {
      // Tipo de propiedad: 'vivienda', 'industrial', 'lote', 'comercial', etc.
      type: DataTypes.STRING,
      allowNull: false,
    },
    subtype: {
      // Tipo de propiedad: 'casa', 'departamento', 'moonambiente','local', 'galpón', 'nave industrial', 'oficina' etc.
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      // Categoría: 'venta', 'alquiler'
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(15, 2), // Para manejar precios con decimales
      allowNull: false,
    },
    currency: {
      // Moneda, ej: 'USD', 'ARS'
      type: DataTypes.STRING,
      defaultValue: "USD",
    },
    specificCharacteristics: {
      type: DataTypes.JSONB, // Tipo de dato JSONB para PostgreSQL
      allowNull: true, // Puede ser nulo si no hay características específicas
      defaultValue: {}, // Por defecto, un objeto JSON vacío
    },
    amenities: { // Campo para comodidades
      type: DataTypes.ARRAY(DataTypes.STRING), // ¡Asegúrate que sea DataTypes.ARRAY(DataTypes.STRING)!
      allowNull: true
    },
    // Campos para archivos (imágenes, video, PDF) - Almacenarías URL/rutas de archivos
    images: {
      // Array de URLs o rutas a las imágenes
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    videoUrl: {
      // Ahora será para un enlace directo (ej. YouTube)
      type: DataTypes.STRING, // Un STRING es suficiente para una URL
      allowNull: true,
    },
    pdfUrl: {
      // URL o ruta al PDF
      type: DataTypes.STRING,
      allowNull: true,
    },
    // --- Coordenadas para Mapas Interactivos ---
    latitude: {
      type: DataTypes.DECIMAL(10, 7), // Ej: -34.1234567
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7), // Ej: -58.1234567
      allowNull: true,
    },


    isPublished: {
      // Para publicar/despublicar la propiedad
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // --- ¡CAMPOS PRIVADOS PARA ADMINISTRACIÓN! ---
// --- 1. CAMPOS NUEVOS (Para la nueva estructura) ---
    ownerId: { 
      type: DataTypes.INTEGER,
      allowNull: true, 
    },
    agentId: { // FK a la tabla agents
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    privateNotes: {
      type: DataTypes.TEXT, // TEXT para notas largas
      allowNull: true,
    },
    
    internalDocsUrls: {
      // Para enlaces a documentación interna (ej. PDFs en Google Drive, Dropbox, etc.)
      type: DataTypes.ARRAY(DataTypes.STRING), // Array de strings para múltiples URLs
      allowNull: true,
    }


    // ----------------------------------------------------
  },
  {
    tableName: "properties", // Nombre real de la tabla en la DB
    timestamps: true,
  }
);

const Owner = sequelize.define(
  "Owner",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    fullName: { // Usamos camelCase para JS, Sequelize lo maneja
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true }
    },
    privateNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  },
  {
    tableName: "owners",
    timestamps: true,
  }
);

// --- MODELO LEAD (Interesado) ---
const Lead = sequelize.define(
  "Lead",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false, // El teléfono suele ser clave
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Nuevo", // Ej: Nuevo, Contactado, En Espera, Cerrado
    },
    source: {
      type: DataTypes.STRING, // Ej: "Web", "Instagram", "Manual"
      defaultValue: "Web"
    }
  },
  {
    tableName: "leads",
    timestamps: true,
  }
);

// --- MODELO AGENTE (Directorio de Contactos) ---
const Agent = sequelize.define("Agent", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: { // Opcional, por si quieres enviarles notificaciones
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Podríamos agregar 'photoUrl' en el futuro si quieres mostrar su cara
}, {
  tableName: "agents",
  timestamps: true,
});

//MODELO: COLEGA (Inmobiliaria Externa)
const Colleague = sequelize.define("Colleague", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  fullName: { // Nombre del colega o contacto
    type: DataTypes.STRING,
    allowNull: false,
  },
  agencyName: { // Nombre de la Inmobiliaria
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true }
  },
  privateNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: "colleagues",
  timestamps: true,
});


// --- RELACIONES ACTUALIZADAS ---

// 1. Propietarios y Propiedades 
Owner.hasMany(Property, { foreignKey: 'ownerId', as: 'properties' });
Property.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });

// 2. Agentes y Propiedades 
Agent.hasMany(Property, { foreignKey: 'agentId', as: 'properties' });
Property.belongsTo(Agent, { foreignKey: 'agentId', as: 'contactAgent' });

// 3. Propiedades y Leads 
Property.hasMany(Lead, { foreignKey: 'propertyId', as: 'leads' });
Lead.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// 4. Propiedad y Origen de Propiedad (Nuetro o de Colega)
Colleague.hasMany(Property, { foreignKey: 'colleagueId', as: 'externalProperties' });
Property.belongsTo(Colleague, { foreignKey: 'colleagueId', as: 'sourceColleague' });

// --- Sincronizar Modelos con la Base de Datos ---
// Esto creará las tablas si no existen.
// En producción, es mejor usar migraciones de Sequelize.
// --- Sincronizar Modelos con la Base de Datos ---
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexión a la base de datos establecida exitosamente.");
    
    // --- IMPORTANTE PARA LOCALHOST ---
    // Descomenta esta línea en tu PC LOCAL la primera vez para crear las tablas nuevas.
    // En el SERVIDOR DE PRODUCCIÓN, déjala comentada.
    await sequelize.sync({ alter: true }); 
    
    console.log("Tablas sincronizadas.");
  } catch (error) {
    console.error("No se pudo conectar o sincronizar:", error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  User,
  Property,
  Owner, 
  Lead,
  Agent,
  Colleague,
  connectDB,
};