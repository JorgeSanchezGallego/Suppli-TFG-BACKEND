const mongoose = require('mongoose');

const barSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    ubicacion: {
        type: String,
        required: true,
        trim: true,
        immutable: true
    },
    encargados: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario'
        }],
        validate: {
            validator: (lista) => Array.isArray(lista) && lista.length > 0,
            message: 'Un bar tiene que tener al menos un encargado'
        }
    },
    imagen: {
        type: String,
        trim: true
    }
},

    {
        timestamps: true,
        versionKey: false
    })


const Bar = mongoose.model('Bar', barSchema);

module.exports = Bar;
