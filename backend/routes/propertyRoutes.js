// backend/routes/propertyRoutes.js
const express = require('express');
const router = express.Router();
const { uploadMiddleware } = require('../middlewares/uploadMiddleware'); 
const propertyController = require('../controllers/propertyController');
const { authenticate } = require('../middlewares/authMiddleware');

// Búsqueda, mapa y filtros (Deben ir ANTES de /:id para que no confunda "search" con un ID)
router.get('/all-for-map', propertyController.getAllForMap);
router.get('/search', propertyController.search);
router.get('/public-localities', propertyController.getLocalities);
router.get('/public-categories', propertyController.getCategories);
router.get('/public-types', propertyController.getTypes);
router.get('/public-subtypes', propertyController.getSubtypes);
router.get('/public-suggestions', propertyController.getPublicSuggestions);
router.get('/public-properties/:id/similar', propertyController.getSimilar);

// Redirecciones viejas
// Si tu frontend llama a /public-properties para filtrar, redirigimos a search
router.get('/public-properties', propertyController.search);
// Si tu frontend llama a /public-properties/:id para ver detalle, redirigimos a getById
router.get('/public-properties/:id', propertyController.getById);

// Lectura General
router.get('/', propertyController.getAll);
router.get('/:id', propertyController.getById);

// ==========================================
// RUTAS PRIVADAS (Con authenticate) 
// ==========================================

// Solo un admin logueado puede crear, editar o borrar
router.post('/', authenticate, uploadMiddleware, propertyController.create);
router.put('/:id', authenticate, uploadMiddleware, propertyController.update);
router.delete('/:id', authenticate, propertyController.delete);
// Acción Específica Privada
router.put('/:id/toggle-published', authenticate, propertyController.togglePublished);

module.exports = router;