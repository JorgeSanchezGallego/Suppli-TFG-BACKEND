const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellidos: {
        type: String,
        required: true,
        trim: true
    },
    bares: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bar'
    }],
    fechaNacimiento: {
        type: Date,
        required: true
    },
    residencia: {
        type: String,
        required: true,
        trim: true
    },
    correo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    contraseña: {
        type: String,
        required: true,
        trim: true,
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
    },
    telefono: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['encargado', 'empleado', 'proveedor'],
        default: 'empleado'
    },
    proveedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proveedor',
        required: function () {
            return this.role === 'proveedor';
        }
    }
}, {
    timestamps: true,
    versionKey: false
});


usuarioSchema.pre('save', async function (){
    if (!this.isModified('contraseña')) {
        return
    }
    try {
        this.contraseña = await bcrypt.hash(this.contraseña, 10);
    } catch (error) {
        console.error('Error al encriptar la contraseña:', error);
        throw new Error('Error al encriptar la contraseña');
    }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
module.exports = Usuario;