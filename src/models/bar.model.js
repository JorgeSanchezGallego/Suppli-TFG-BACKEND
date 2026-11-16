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
    encargado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        immutable: true
    }
},

    {
        timestamps: true,
        versionKey: false
    })


const Bar = mongoose.model('Bar', barSchema);

module.exports = Bar;
