const mongoose = require("mongoose");

const subcategoriaModel = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    medidas: {
        type: String,
        required: true
    },
});

const Subcategoria = mongoose.model("Subcategoria", subcategoriaModel);
module.exports = Subcategoria;