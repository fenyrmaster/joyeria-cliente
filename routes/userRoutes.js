const express = require('express');
const userController = require('../controllers/userController');
const authController = require("../controllers/authController");
const pagosController = require("../controllers/pagosController")

const userRouter = express.Router();

userRouter.post("/signup", authController.signup);
userRouter.get("/remind", authController.remindUser);
userRouter.get("/logout", authController.logout);
userRouter.post("/login", authController.login);
userRouter.post("/forgotPassword", authController.forgotPass);
userRouter.patch("/resetPassword/:token", authController.resetPass);
userRouter.get("/confirm/:token", authController.confirmIdentity);
userRouter.patch("/updatePassword/me", authController.protect, authController.restrict("cliente"), authController.updatePassword);
userRouter.patch("/updateData", authController.protect, authController.restrict("cliente"), userController.updateMe);

userRouter.post("/carritoAgregar", authController.protect, userController.addCarrito);
userRouter.patch("/carritoEliminar", authController.protect, userController.removeCarrito);
userRouter.patch("/envioCambiar", authController.protect, userController.cambiarEnvio);
userRouter.patch("/metodoCambiar", authController.protect, userController.cambiarPago);
userRouter.patch("/medidasCambiar", authController.protect, userController.cambiarMedida);
userRouter.patch("/cantidadCambiar", authController.protect, userController.cambiarCantidad);
userRouter.get("/obtenerTotal", authController.protect, userController.calcularTotal);
userRouter.get("/checkout-session/:id", authController.protect, pagosController.getCheckoutSe);

userRouter
  .route('/')
  .get(authController.protect,authController.restrict("admin") ,userController.getAllUsers)
userRouter
  .route('/:id')
  .get(authController.protect,authController.restrict("admin") ,userController.getUser)
  .patch(authController.protect, authController.restrict("admin"), userController.updateUser)
  .delete(authController.protect, authController.restrict("admin") ,userController.removeUser);

module.exports = userRouter;