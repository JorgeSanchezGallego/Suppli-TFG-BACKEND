const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const {CloudinaryStorage} = require('multer-storage-cloudinary');

const storageProductos = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'productos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    },
});

const subidaProducto = multer({ storage: storageProductos });

module.exports = {
    subidaProducto,
};