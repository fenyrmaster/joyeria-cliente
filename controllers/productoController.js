const factory = require("../controllers/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const Producto = require("../models/productoModel");
const ApiErrors = require("../utils/appError");
const cloudinary = require("cloudinary").v2;
const uuid = require("uuid");
const multer = require("multer");
const sharp = require("sharp");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")){
        cb(null, true)
    } else {
        cb(new CustomError("Not a image, please upload an actual image", 400), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadProductoImages = upload.fields([
    { name: "imagenPortada", maxCount: 1 },
    { name: "imagenes", maxCount: 8 }
]);

exports.registrarFotos = catchAsync(async(req,res,next) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
        secure: true
    });
    if(!req.files) return next();
    const imagenPortada = `producto-${uuid.v4()}-${Date.now()}-portada`;
    await sharp(req.files.imagenPortada[0].buffer).resize(600,500).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/productos/${imagenPortada}`);
    await cloudinary.uploader.upload(`public/img/productos/${imagenPortada}`,{
        resource_type: "image",
        public_id: imagenPortada
    });
    let url = cloudinary.image(imagenPortada);
    let urlCortada = url.split("=")[1].split("'")[1];
    req.body.imagenPortada = urlCortada;
    req.body.imagenes = [];
    if(req.files.imagenes){
    await Promise.all(req.files.imagenes.map(async(file, index) => {
        const filename = `producto-${uuid.v4()}-${Date.now()}-${index+1}`;
        await sharp(req.files.imagenes[index].buffer).resize(600, 500).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/productos/${filename}`);
        await cloudinary.uploader.upload(`public/img/productos/${filename}`,{
            resource_type: "image",
            public_id: filename
        });
        let urlAqui = cloudinary.image(filename);
        req.body.imagenes.push(urlAqui.split("=")[1].split("'")[1]);
    }));
    }
    next();
})

exports.registrarFotosUpdate = catchAsync(async(req,res,next) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
        secure: true
    });
    if(!req.files) return next();
    if(req.files.imagenPortada){
        const imagenPortada = `producto-${uuid.v4()}-${Date.now()}-portada`;
        console.log("si funciona 1");
        await sharp(req.files.imagenPortada[0].buffer).resize(600,500).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/productos/${imagenPortada}`);
        await cloudinary.uploader.upload(`public/img/productos/${imagenPortada}`,{
            resource_type: "image",
            public_id: imagenPortada
        });
        console.log("si funciona 2");
        let url = cloudinary.image(imagenPortada);
        let urlCortada = url.split("=")[1].split("'")[1];
        req.body.imagenPortada = urlCortada;
        console.log("si funciona 3");
    }
    if(req.files.imagenes){
        await Promise.all(req.files.imagenes.map(async(file, index) => {
            req.body.imagenes = [];
            const filename = `producto-${uuid.v4()}-${Date.now()}-${index+1}`;
            await sharp(req.files.imagenes[index].buffer).resize(600, 500).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/productos/${filename}`);
            await cloudinary.uploader.upload(`public/img/productos/${filename}`,{
                resource_type: "image",
                public_id: filename
            });
            let urlAqui = cloudinary.image(filename);
            req.body.imagenes.push(urlAqui.split("=")[1].split("'")[1]);
        }));
    }
    next();
})

exports.createProducto = catchAsync(async(req,res) => {
    const newProducto = await Producto.create({
        nombre: req.body.nombre,
        codigo: req.body.codigo,
        precio: req.body.precio,
        peso: req.body.peso,
        tipo: req.body.tipo,
        subcategoria: req.body.subcategoria,
        imagenPortada: req.body.imagenPortada,
        imagenes: req.body.imagenes
    });
    res.status(201).json({
        status: "success",
        data: {
            newProducto
        }
    })
});

exports.getAllProductos = factory.getAll(Producto);
exports.updateProducto = factory.updateData(Producto);
exports.deleteProducto = catchAsync(async (req,res,next) => {
    const fotos = await Producto.findById(req.params.id);
    if(fotos.imagenes.length !== 0){
        fotos.imagenes.forEach(el => {
            let photo = el.split("/");
            cloudinary.uploader.destroy(photo[photo.length - 1]);
        })
    }
    const doc = await Producto.findByIdAndDelete(req.params.id);
    if(!doc) {
        return next(new ApiErrors(`The document with this id (${req.params.id}) doesnt exist`, 404))
    }
    res.status(204).json({
        status: "success",
        data: null
    })
});
exports.getPopularProductos = catchAsync(async(req,res,next) => {
    const doc = await Producto.find({"promocionFecha":{$gt: new Date(Date.now()).toISOString()}, "stock": true}).limit(6);
    res.status(200).json({
        status: "success",
        results: doc.length,
        data: {
            results: doc
        }
    });
})
exports.getProducto = catchAsync(async(req,res,next) => {
    const doc = await Producto.find({"codigo": req.params.codigo});
    res.status(200).json({
        status: "success",
        results: doc.length,
        data: {
            results: doc
        }
    });
});