const path = require('path');
const fs = require('fs');
const multer = require('multer'); 

// Asegurarse de que el directorio de uploads exista
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configuración de Multer para almacenamiento de archivos
// Multer es una librería de Node.js para manejar multipart/form-data, usado para subir archivos no JSON.

const storage = multer.diskStorage({
    //cb es una función de callback que indica dónde guardar el archivo
    // Función para definir el destino del archivo
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },

    // Función para definir el nombre del archivo subido
    filename: function (req, file, cb) {
        // 1. Obtenemos la extensión del archivo (ej: .pdf)
        const ext = path.extname(file.originalname);

        // 2. Obtenemos el nombre base sin la extensión
        const name = path.parse(file.originalname).name;

        // 3. Limpiamos el nombre (espacios por guiones permitiendo solo un guion, solo letras/números)
        const sanitizedName = name.replace(/\s+/g, '-')
                                  .replace(/[^a-zA-Z0-9\-_]/g, '')
                                  .replace(/-+/g, '-');
        
        // 4. Resultado: NombreOriginal-Fecha.extensión
        // Ej: "Plano-Lote-1715551234.pdf"
        cb(null, `${sanitizedName}-${Date.now()}${ext}`);
    }
});

// Filtro para aceptar solo ciertos tipos de archivos
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo imágenes (JPG, PNG, GIF) y PDFs.'), false);
    }
};
// Configuración final de Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }
});

// Middleware wrapper para manejar campos opcionales 
const uploadMiddleware = (req, res, next) => {
    // Verificamos si la solicitud es multipart/form-data
    const isMultipart = req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data');
    // Si es multipart, usamos multer para manejar la subida y procesar los archivos
    if (isMultipart) {
        upload.fields([
            // Definimos la cantidad máxima de archivos por campo
            { name: 'images', maxCount: 25 },
            { name: 'pdf', maxCount: 1 }
        ])(req, res, (err) => {
            if (err) return res.status(500).json({ message: 'Error subiendo archivos. Solo imágenes (JPG, PNG, GIF) y PDFs están permitidos.'});
            next();
        });

    } else {
        // Si no es multipart/form-data, simplemente continuamos
        next();
    }
};

module.exports = { uploadMiddleware, uploadsDir };