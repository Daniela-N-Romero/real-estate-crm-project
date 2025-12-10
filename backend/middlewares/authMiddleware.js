// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'mi_clave_secreta_para_jwt_super_segura_y_larga';

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) { return res.status(401).json({ message: 'No autorizado. Token no proporcionado.' }); }
    
    const token = authHeader.split(' ')[1];
    if (!token) { return res.status(401).json({ message: 'No autorizado. Formato de token inválido.' }); }
    
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Error de autenticación de token:', err.message);
        return res.status(401).json({ message: 'No autorizado. Token inválido o expirado.' });
    }
};

module.exports = { authenticate };