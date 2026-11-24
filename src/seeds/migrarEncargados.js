const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

const Bar = require('../models/bar.model');

/**
 * Migra los bares creados cuando cada bar tenía un único encargado (campo `encargado`)
 * al formato actual, con una lista de encargados (campo `encargados`).
 * A cada bar antiguo se le pone `encargados: [encargado]` y se le quita el campo viejo.
 * Los bares que ya están en el formato nuevo no se tocan, así que se puede ejecutar
 * varias veces sin problema.
 *
 * Uso: `npm run migrar:encargados`
 *
 * @async
 * @returns {Promise<void>}
 */
const main = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {family: 4});
        console.log('Conectado a la BBDD');
        const {modifiedCount} = await Bar.collection.updateMany(
            {encargado: {$exists: true}},
            [
                {$set: {encargados: ['$encargado']}},
                {$unset: 'encargado'}
            ]
        );
        console.log(`${modifiedCount} bar(es) migrado(s) al formato con varios encargados`);
    } catch (error) {
        console.error('Error al migrar los bares:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

main();
