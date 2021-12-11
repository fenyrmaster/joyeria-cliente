const Subcategoria = require("../models/subcategoriaModel");
const Producto = require("../models/productoModel");
const catchAsync = require("../utils/catchAsync");
const ApiErrors = require("../utils/appError");
const factory = require("../controllers/handlerFactory");

exports.createSubcategoria = catchAsync(async(req,res) => {
    const newSubcategoria = await Subcategoria.create({
        nombre: req.body.nombre,
        medidas: req.body.medidas
    });
    res.status(201).json({
        status: "success",
        data: {
            newSubcategoria
        }
    })
});

exports.getAllSubs = factory.getAll(Subcategoria);
exports.getSub = factory.getOne(Subcategoria);
exports.updateSub = factory.updateData(Subcategoria);
exports.removeSub = catchAsync(async (req,res,next) => {
    const productos = await Producto.find({tipo: {$ne: "Catalogo"}, subcategoria: req.params.id});
    if(productos.length === 0){
        const doc = await Subcategoria.findByIdAndDelete(req.params.id);
        if(!doc) {
            return next(new ApiErrors(`The document with this id (${req.params.id}) doesnt exist`, 404))
        }
        res.status(204).json({
            status: "success",
            data: null
        })
    } else{
        return next(new ApiErrors(`Hay ${productos.length} productos que tienen esta subcategoria, elimine o cambie la subcategoria de esos productos en "Administrar Productos"`, 400))
    }
});