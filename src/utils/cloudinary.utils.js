const cloudinary = require('cloudinary').v2;

/**
 * Borra una imagen de Cloudinary a partir de su URL. Obtiene el `public_id` con la
 * carpeta y el nombre del archivo, por ejemplo `productos/abc123` de
 * `https://res.cloudinary.com/<cuenta>/image/upload/v123/productos/abc123.png`.
 *
 * El borrado se lanza sin esperar a que termine, para no retrasar la respuesta.
 *
 * @param {string} url - URL de la imagen en Cloudinary.
 * @returns {void}
 */
const borrarImagenCloudinary = (url) => {
    const array = url.split('/');
    const nombre = array.at(-1).split('.')[0];
    
    let public_id = `${array.at(-2)}/${nombre}`;
    cloudinary.uploader.destroy(public_id, () => {
        console.log("Imagen eliminada de Cloudinary");
    });
};

module.exports = {borrarImagenCloudinary};