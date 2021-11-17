const ApiErrors = require("../utils/appError");
const APIfeatures = require("../utils/APIFeatures");
const catchAsync = require("../utils/catchAsync");

exports.deleteOne = Model => catchAsync(async (req,res,next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if(!doc) {
        return next(new ApiErrors(`The document with this id (${req.params.id}) doesnt exist`, 404))
    }
    res.status(204).json({
        status: "success",
        data: null
    })
});

exports.updateData = Model => catchAsync(async (req,res,next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if(!doc) {
        return next(new ApiErrors(`The document with this id (${req.params.id}) doesnt exist`, 404))
    }
    res.status(200).json({
        status: "success",
        data: {
        doc
    }
})
});
exports.getOne = (Model, popOptions) => catchAsync(async(req,res,next) => {
    let query = Model.findById(req.params.id);
    if(popOptions) query = query.populate(popOptions);
    const doc = await query;
    if(!doc) {
        return next(new ApiErrors("No doc was found", 404))
    }
    res.status(200).json({
        status: "success",
        data: {
        doc
    }
})
});
exports.getAll = (Model) => catchAsync(async(req,res,next) => {
    const features = new APIfeatures(Model.find(), req.query).filter().sort().limits().pagination();
    const doc = await features.query;
    res.status(200).json({
        status: "success",
        results: doc.length,
        data: {
            results: doc
        }
    });
})