// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Owner, Agent, Colleague, Property } = require('../config/database');

const jwtSecret = process.env.JWT_SECRET || 'mi_clave_secreta_para_jwt_super_segura_y_larga';

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username: username } });
        if (!user) { return res.status(401).json({ message: 'Credenciales inválidas' }); }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { return res.status(401).json({ message: 'Credenciales inválidas' }); }
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            jwtSecret,
            { expiresIn: '1h' }
        );
        res.json({ message: 'Login exitoso', token, redirectTo: '/admin/control-panel.html' });
    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

router.post('/logout', (req, res) => {
    res.json({ message: 'Sesión cerrada', redirectTo: '/admin/login.html' });
});


// Nueva ruta: Lista de Localidades Únicas
router.get('/localities-list', async (req, res) => {
    try {
        const properties = await Property.findAll({
            attributes: ['locality'],
            group: ['locality'],      // Agrupa para no repetir "Berazategui" 500 veces
            order: [['locality', 'ASC']]
        });
        
        // Convertimos a una lista simple: ["Berazategui", "Ezpeleta", "Hudson"]
        const localities = properties.map(p => p.locality).filter(Boolean);
        res.json(localities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando localidades' });
    }
});

// Obtener lista de usuarios (Agentes/Admins)
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({ attributes: ['id', 'username'] });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error' });
    }
});

// Obtener lista de propietarios
router.get('/owners', async (req, res) => {
    try {
        const owners = await Owner.findAll({
            attributes: ['id', 'fullName', 'phoneNumber', 'privateNotes'], 
            order: [['fullName', 'ASC']]
        });
        res.json(owners);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error' });
    }
});

//Obtener un solo propietario por ID (Para llenar el formulario de edición)
router.get('/owners/:id', async (req, res) => {
    try {
        const owner = await Owner.findByPk(req.params.id);
        if (!owner) return res.status(404).json({ message: 'Propietario no encontrado' });
        res.json(owner);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener propietario' });
    }
});

//Actualizar propietario (PUT)
router.put('/owners/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, phoneNumber, email, privateNotes } = req.body;
        
        const owner = await Owner.findByPk(id);
        if (!owner) return res.status(404).json({ message: 'No encontrado' });

        await owner.update({
            fullName,
            phoneNumber: phoneNumber || null,
            email: email || null,
            privateNotes: privateNotes || null
        });

        res.json(owner);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar' });
    }
});

// Obtener lista de Agentes
router.get('/agents', async (req, res) => {
    try {
        const agents = await Agent.findAll({
            attributes: ['id', 'fullName'],
            order: [['fullName', 'ASC']]
        });
        res.json(agents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error' });
    }
});

router.post('/owners', async (req, res) => {
    try {
        const { fullName, phoneNumber, email, privateNotes } = req.body;

        // Validación básica
        if (!fullName) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        // Creamos usando el modelo Owner que ya importaste
        const newOwner = await Owner.create({
            fullName,      // Coincide con tu modelo en database.js
            phoneNumber: phoneNumber || null, 
            email: email || null, 
            privateNotes: privateNotes || null
        });

        // Devolvemos el objeto creado para que el frontend lo use
        res.status(201).json(newOwner);

    } catch (error) {
        console.error('Error al crear propietario:', error);

        if (error.name === 'SequelizeValidationError') {
             return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: 'Error al guardar el propietario.' });
    }
});

// Obtener lista de colegas (Para el select)
router.get('/colleagues', async (req, res) => {
    try {
        const colleagues = await Colleague.findAll({
            attributes: ['id', 'fullName', 'agencyName', 'privateNotes', 'phoneNumber'],
            order: [['agencyName', 'ASC']]
        });
        res.json(colleagues);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar colegas' });
    }
});

// Crear colega rápido (Para el modal)
router.post('/colleagues', async (req, res) => {
    try {
        const { fullName, agencyName, phoneNumber, email , privateNotes} = req.body;
         
        if (!fullName) return res.status(400).json({ message: 'Nombre obligatorio' });

        const newColleague = await Colleague.create({
            fullName,
            agencyName,
            phoneNumber: phoneNumber || null,
            email: email || null,
            privateNotes: privateNotes || null
        });
        res.json(newColleague);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear colega' });
    }
});

//Obtener un solo colega
router.get('/colleagues/:id', async (req, res) => {
    try {
        const col = await Colleague.findByPk(req.params.id);
        if (!col) return res.status(404).json({ message: 'Colega no encontrado' });
        res.json(col);
    } catch (error) {
        res.status(500).json({ message: 'Error servidor' });
    }
});

//Actualizar colega
router.put('/colleagues/:id', async (req, res) => {
    try {
        const { fullName, agencyName, phoneNumber, email, privateNotes } = req.body;
        const col = await Colleague.findByPk(req.params.id);
        if (!col) return res.status(404).json({ message: 'No encontrado' });

        await col.update({
            fullName, agencyName,
            phoneNumber: phoneNumber || null,
            email: email || null,
            privateNotes: privateNotes || null
        });
        res.json(col);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar colega' });
    }
});


module.exports = router;