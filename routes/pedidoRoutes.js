const express = require('express');
const authController = require("../controllers/authController");
const pedidosController = require("../controllers/pedidosController");

const pedidoRouter = express.Router();

pedidoRouter.delete("/eliminarPedido/:codigo", authController.protect, pedidosController.deletePedido);

pedidoRouter
  .route('/')
  .get(authController.protect, pedidosController.getAllPedidos);
pedidoRouter
  .route('/:id')
  .post(authController.protect, pedidosController.crearPedido);

module.exports = pedidoRouter;