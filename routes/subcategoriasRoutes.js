const express = require('express');
const authController = require("../controllers/authController");
const subcategoriasController = require("../controllers/subcategoriasController");

const subcategoriaRouter = express.Router();

subcategoriaRouter
  .route('/')
  .get(subcategoriasController.getAllSubs)
  .post(authController.protect, authController.restrict("admin"), subcategoriasController.createSubcategoria);
subcategoriaRouter
  .route('/:id')
  .get(subcategoriasController.getSub)
  .patch(authController.protect, authController.restrict("admin"), subcategoriasController.updateSub)
  .delete(authController.protect, authController.restrict("admin") ,subcategoriasController.removeSub);

module.exports = subcategoriaRouter;
