const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const ApiErrors = require("../utils/appError");
const factory = require("../controllers/handlerFactory");

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "public/img/users");
//     },
//     filename: (req,file,cb) => {
//         const ext = file.mimetype.split("/")[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });

const filterObj = (obj, ...allowedfields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedfields.includes(el)){
            newObj[el] = obj[el];
        }
    })
    return newObj;
}

exports.getMe = (req,res,next) => {
    req.params.id = req.user.id;
    next();
}

exports.updateMe = catchAsync(async(req,res,next) => {
    if(req.body.password || req.body.confirmPassword){
        return next(new ApiErrors("En este formulario no puedes poner contraseñas", 400));
    }
    const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
        new: true, 
        runValidators: true
    });

    res.status(201).json({
        status: "success",
        data: {
            user: updatedUser
        }
    })
});

exports.deleteMe = catchAsync(async(req,res,next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false});
    res.status(204).json({
        status: "success",
        data: null
    })
});

exports.addCarrito = catchAsync(async(req,res,next) => {
    const body = {
        producto: req.body.productoId,
        talla: "0",
        cantidad: 1
    }
    if(await User.findOne({ _id: req.user._id, carrito: {$elemMatch: { producto: req.body.productoId}}})){
        return next(new ApiErrors("Este producto ya esta en tu carrito", 400));
    };
    const productoCart = await User.findByIdAndUpdate(req.user._id, { $push: { carrito: body } }, {new: true});
    res.status(201).json({
        status: "correcto",
        message: "Usuario actualizado",
        data: {
            productoCart
        }
    })
});
exports.removeCarrito = catchAsync(async (req,res,next) => {
    await User.updateOne({$and: [{carrito: {$elemMatch: { _id: req.body.id }}},{_id: req.user.id}]},
        { $pull: {carrito: { _id: req.body.id }}}, {new: true});
    const productoCart = await User.findById(req.user.id);
    res.status(201).json({
        status: "correcto",
        data: {
            productoCart
        }
    })
});
exports.cambiarEnvio = catchAsync(async(req,res,next) => {
    const usuario = await User.findByIdAndUpdate(req.user._id, { envio: req.body.envio }, {new: true});
    res.status(200).json({
        status: "correcto",
        data: {
            usuario
        }
    })
})
exports.cambiarPago = catchAsync(async(req,res,next) => {
    const usuario = await User.findByIdAndUpdate(req.user._id, { metodoPago: req.body.metodoPago }, {new: true});
    res.status(200).json({
        status: "correcto",
        data: {
            usuario
        }
    })
});
exports.cambiarMedida = catchAsync(async(req,res,next) => {
    await User.updateOne({$and: [{carrito: {$elemMatch: { _id: req.body.id }}},{_id: req.user.id}]},
        { $set: {"carrito.$[group].talla": req.body.medida}},
         {arrayFilters: [{ "group._id": req.body.id }]});
    const usuario = await User.findById(req.user.id);
    res.status(200).json({
        status: "correcto",
        data: {
            usuario
        }
    })
})
exports.cambiarCantidad = catchAsync(async(req,res,next) => {
    await User.updateOne({$and: [{carrito: {$elemMatch: { _id: req.body.id }}},{_id: req.user.id}]},
        { $set: {"carrito.$[group].cantidad": req.body.cantidad}},
         {arrayFilters: [{ "group._id": req.body.id }]});
    const usuario = await User.findById(req.user.id);
    res.status(200).json({
        status: "correcto",
        data: {
            usuario
        }
    })
});
exports.calcularTotal = catchAsync(async(req,res,next) => {
    const usuario = await User.findById(req.user.id);
    let total = 0;
    if(usuario.carrito !== 0){
        usuario.carrito.forEach(el => {
            if(el.producto){
                if(el.producto.promocionFecha && el.producto.stock && new Date(el.producto.promocionFecha) > new Date(Date.now())){
                    let costo = Math.ceil(((el.producto.precio / 100)*(100 - el.producto.promocionPorcentaje))*el.cantidad);
                    total = total+costo;
                } else{
                    let costo = Math.ceil(el.producto.precio * el.cantidad)
                    total = total+costo
                }
            }
        })
    }
    const usuarioTotal = await User.findByIdAndUpdate(req.user.id, { total: total }, {new: true});
    res.status(200).json({
        status: "correcto",
        data: {
            usuarioTotal
        }
    })
})

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateData(User);
exports.removeUser = factory.deleteOne(User);