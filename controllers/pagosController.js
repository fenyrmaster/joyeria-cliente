const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const ApiErrors = require("../utils/appError");

exports.getCheckoutSe = catchAsync(async(req,res,next) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const usuario = await User.findById(req.params.id);
    let productos = [];
    usuario.carrito.map(el => {
        let total = 0;
        if(el.producto.promocionFecha && el.producto.stock && new Date(el.producto.promocionFecha) > new Date(Date.now())){
            let costo = Math.ceil(((el.producto.precio / 100)*(100 - el.producto.promocionPorcentaje)));
            total = costo;
        } else{
            let costo = Math.ceil(el.producto.precio)
            total = costo
        }
        let objeto = {
            name: el.producto.nombre,
            description: el.producto.codigo,
            images: [el.producto.imagenPortada],
            amount: total*100,
            currency: "mxn",
            quantity: el.cantidad
        }
        productos.push(objeto);
    })
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        success_url: `${process.env.URL_FRONT}/app/crearPedido/${usuario._id}`,
        cancel_url: `${process.env.URL_FRONT}/carrito`,
        customer_email: req.user.email,
        client_reference_id: req.user._id,
        line_items: productos
    })
    res.status(200).json({
        status: "success",
        session
    })
});