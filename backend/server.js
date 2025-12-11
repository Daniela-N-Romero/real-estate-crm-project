// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.disable('x-powered-by'); // Mejora la seguridad al ocultar que usamos Express


const { connectDB } = require('./config/database');
// Middlewares para parsear cuerpos de solicitudes JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Servir archivos estáticos (Versión Explícita y Robusta) ---

const projectRoot = path.join(__dirname, '..');

app.use('/css', express.static(path.join(projectRoot, 'css')));
app.use('/js', express.static(path.join(projectRoot, 'js')));
app.use('/assets', express.static(path.join(projectRoot, 'assets')));
app.use('/admin', express.static(path.join(projectRoot, 'admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.sendFile(path.join(projectRoot, 'index.html'));
});

app.get('/results.html', (req, res) => {
    res.sendFile(path.join(projectRoot, 'pages', 'results.html'));
});
// Captura cualquier cosa que se parezca a /propiedad/ID-lo-que-sea
app.get('/propiedad/:id/:slug', (req, res) => {
    // El resto de la función queda igual
    res.sendFile(path.join(projectRoot, 'pages','property-template.html'));
});

// --- Rutas de API ---
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);

// Middleware para manejar errores 404
app.use((req, res, next) => {
    res.status(404).send("Lo siento, la página que buscas no se puede encontrar.");
});

// Conexión a la base de datos e inicio del servidor
connectDB().then(() => {
    app.listen(port, () => {
        const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

        console.log(`🚀 Servidor arrancado exitosamente.`);
        console.log(`🌐 Sitio público: ${baseUrl}`);
        console.log(`🔐 Panel Admin: ${baseUrl}/admin/login.html`);
    });
}).catch(err => {
    console.error('Fallo al iniciar el servidor debido a un error de base de datos:', err);
    process.exit(1);
});
