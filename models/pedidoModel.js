const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const pedidoModel = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        validate: [validator.isEmail, "Por favor usa un email valido"]
    },
    telefono: {
        type: String,
        required: true,
    },
    domicilio: {
        type: String,
        required: true
    },
    domicilioDetalles: {
        type: String,
        default: "No especificado"
    },
    localidad: {
        type: String,
        required: true
    },
    carrito: [
        {
            imagenPortada:{
                type: String,
            },
            medida: {
                type: String
            },
            cantidad: {
                type: Number
            },
            precio: {
                type: Number
            },
            codigo: {
                type: String
            },
            nombre: {
                type: String
            }
        }
    ],
    metodoPago: {
        type: String,
        enum: ["Tarjeta", "OXXO"],
        default: "OXXO"
    },
    total: {
        type: Number
    },
    envio: {
        type: Boolean,
        default: true
    },
    codigo: {
        type: Number,
    },
    usuario: {
        type: mongoose.Schema.ObjectId,
        ref: "Usuario"
    }
},{
    timestamps: true
});

pedidoModel.pre("save", function(next){
    if(this.isNew){
    const numeroAleatorio = Math.floor(Math.random() * 1000000) + 1;
    this.codigo = numeroAleatorio;
    next();
    }
    else{
        return next();
    }
});

const Pedido = mongoose.model("Pedido", pedidoModel);
module.exports = Pedido;