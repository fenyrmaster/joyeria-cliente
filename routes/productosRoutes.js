const express = require('express');
const authController = require("../controllers/authController");
const productoController = require("../controllers/productoController");

const productoRouter = express.Router();

productoRouter.route("/promocion/:id").patch(authController.protect, authController.restrict("admin"), productoController.updateProducto);
productoRouter.route("/popular/promocion").get(productoController.getPopularProductos);
productoRouter.route("/producto/:codigo").get(productoController.getProducto)

productoRouter
  .route('/')
  .get(productoController.getAllProductos)
  .post(authController.protect, authController.restrict("admin"), productoController.uploadProductoImages, productoController.registrarFotos, productoController.createProducto);
productoRouter
  .route('/:id')
  .patch(authController.protect, authController.restrict("admin"), productoController.uploadProductoImages, productoController.registrarFotosUpdate, productoController.updateProducto)
  .delete(authController.protect, authController.restrict("admin"), productoController.deleteProducto);

module.exports = productoRouter;