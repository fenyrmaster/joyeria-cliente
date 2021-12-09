const Pedido = require("../models/pedidoModel");
const catchAsync = require("../utils/catchAsync");
const ApiErrors = require("../utils/appError");
const factory = require("../controllers/handlerFactory");
const Email = require("../utils/email");
const EmailTrabajador = require("../utils/emailTrabajador");
const User = require("../models/userModel");
const Producto = require("../models/productoModel");

exports.crearPedido = catchAsync(async (req,res,next) => {
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
            nombre: el.producto.nombre,
            medida: el.talla,
            imagenPortada: el.producto.imagenPortada,
            precio: total,
            codigo: el.producto.codigo,
            cantidad: el.cantidad
        }
        productos.push(objeto);
        let actualizarVendidos = async (el) => {
            let producto = await Producto.findById(el.producto.id);
            await Producto.findByIdAndUpdate(el.producto.id, {vendidos: producto.vendidos+1})
        }
        actualizarVendidos(el);
    })
    const pedido = await Pedido.create({
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        domicilio: usuario.domicilio,
        domicilioDetalles: usuario.domicilioDetalles,
        localidad: usuario.localidad,
        metodoPago: usuario.metodoPago,
        total: usuario.total,
        envio: usuario.envio,
        usuario: usuario._id,
        carrito: productos
    });
    if(usuario.metodoPago === "Tarjeta"){
        await new Email(usuario, pedido.codigo).sendTarjeta();
    } else if(usuario.metodoPago === "OXXO"){
        await new Email(usuario, pedido.codigo).sendOXXO();
    }
    await new EmailTrabajador(pedido.codigo).sendWarning();
    await User.findByIdAndUpdate(req.params.id, {carrito: []});
    res.status(201).json({
        status: "correcto",
        data: {
            pedido
        }
    })
});

exports.deletePedido = catchAsync(async(req,res,next) => {
    await Pedido.findOneAndDelete({ codigo: req.params.codigo });
    res.status(204).json({
        status: "success",
        data: null
    })
})

exports.getAllPedidos = factory.getAll(Pedido);