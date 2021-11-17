const mongoose = require("mongoose");

const productoModel = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    codigo: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    peso: {
        type: Number,
        required: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ["Oro", "Plata", "Catalogo"],
    },
    subcategoria: {
        type: mongoose.Schema.ObjectId,
        ref: "Subcategoria"
    },
    imagenPortada: {
        type: String,
        required: true
    },
    stock: {
        type: Boolean,
        default: true
    },
    imagenes: [String],
    vendidos: {
        type: Number,
        default: 0
    },
    promocionPorcentaje: {
        type: Number
    },
    promocionFecha: {
        type: Date,
        default: Date.now()
    }
});

productoModel.pre(/^find/, function(next) {
    this.populate({
        path: "subcategoria",
    })
    next();
})

const Producto = mongoose.model("Producto", productoModel);
module.exports = Producto;