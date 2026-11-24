const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const {CloudinaryStorage} = require('multer-storage-cloudinary');

/**
 * Almacenamiento de Multer que sube las imágenes de los productos directamente a
 * Cloudinary, en la carpeta `productos`. Solo acepta imágenes jpg, jpeg, png, gif y webp.
 * @type {CloudinaryStorage}
 */
const storageProductos = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'productos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    },
});

/**
 * Middleware de Multer para subir la imagen de un producto a Cloudinary.
 * Se usa en las rutas con `subidaProducto.single('imagen')`; después, la URL de la
 * imagen subida está disponible en `req.file.path`.
 * @type {import('multer').Multer}
 */
const subidaProducto = multer({ storage: storageProductos });

/**
 * Almacenamiento de Multer que sube las fotos de los bares directamente a Cloudinary,
 * en la carpeta `bares`. Solo acepta imágenes jpg, jpeg, png, gif y webp.
 * @type {CloudinaryStorage}
 */
const storageBares = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'bares',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    },
});

/**
 * Middleware de Multer para subir la foto de un bar a Cloudinary.
 * Se usa en las rutas con `subidaBar.single('imagen')`; la foto es opcional y, si se
 * envía, su URL queda disponible en `req.file.path`.
 * @type {import('multer').Multer}
 */
const subidaBar = multer({ storage: storageBares });

module.exports = {
    subidaProducto,
    subidaBar,
};