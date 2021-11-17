const Subcategoria = require("../models/subcategoriaModel");
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
exports.removeSub = factory.deleteOne(Subcategoria);