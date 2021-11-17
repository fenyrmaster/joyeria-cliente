const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userModel = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, "Por favor usa un email valido"]
    },
    telefono: {
        type: String,
        required: true,
        unique: true
    },
    domicilio: {
        type: String,
        required: true
    },
    domicilioDetalles: {
        type: String,
        default: "No especificado"
    },
    rol: {
        type: String,
        enum: ["cliente", "admin"],
        default: "cliente"
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Una contraseña debe de tener minimo 8 caracteres"],
        select: false
    },
    confirmarPassword: {
        type: String,
        required: true,
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: "Las contraseñas no son las mismas"
        }
    },
    localidad: {
        type: String,
        required: true
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    confirmString: String,
    confirmStringExpiration: Date,
    confirmed: {
        type: Boolean,
        default: false,
        select: false
    },
    carrito: [
        {
            cantidad:{
                type: Number,
                default: 1
            },
            talla: {
                type: String,
                default: "0"
            },
            producto:{
                type: mongoose.Schema.ObjectId,
                ref: "Producto"
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
    }
});

userModel.methods.verificarContraseña = async function(canPass, userPass) {
    return await bcrypt.compare(canPass, userPass);
}

userModel.methods.contraseñaCambiada = function(JWTTimestamp) {
    if(this.passwordChangedAt){
        const timestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < timestamp;
    }
    return false;
}

userModel.pre(/^find/, function(next) {
    this.populate({
        path: "carrito.producto",
        select: "nombre codigo precio subcategoria imagenPortada stock promocionPorcentaje promocionFecha"
    })
    next();
})

userModel.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.confirmarPassword = undefined;
    next();
});

userModel.pre("save", function(next){
    if(!this.isModified("password" || this.isNew)) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userModel.methods.createPassResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 10*60*1000;
    return resetToken;
}

userModel.methods.confirmUser = function() {
    const token = crypto.randomBytes(32).toString("hex");
    this.confirmString = crypto.createHash("sha256").update(token).digest("hex");
    this.confirmStringExpiration = Date.now() + 30*24*60*60*1000;
    return token;
}

const User = mongoose.model("User", userModel);
module.exports = User;