const User = require("../models/userModel");
const { promisify } = require("util");
const ApiErrors = require("../utils/appError");
const JWT = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const crypto = require("crypto");
const Email = require("./../utils/email");
const { emit } = require("process");

const points = {
    points: 7,
    duration: 5*60*1000,
    blockDuration: 5*60*1000
}

const signToken = id => {
    return JWT.sign({ id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);
    res.cookie("jwt", token, {
        maxAge: process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000,
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token: token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req,res,next) => {
    const newUser = await User.create({
        nombre: req.body.nombre,
        email: req.body.email,
        password: req.body.password,
        confirmarPassword: req.body.confirmarPassword,
        telefono: req.body.telefono,
        domicilio: req.body.domicilio,
        localidad: req.body.localidad,
        passwordChangedAt: req.body.passwordChangedAt,
    });

    const token = signToken(newUser._id);
    res.cookie("jwt", token, {
        maxAge: process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000,
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });
    const randomString = newUser.confirmUser();
    const confirmUrl = `${process.env.URL_FRONT}/confirmarCuenta/${randomString}`
    await newUser.save({validateBeforeSave: false});
    newUser.password = undefined;
    const url = `${req.protocol}://${req.get("host")}/me/settings`;
    await new Email(newUser, url).sendWelcome(confirmUrl);

//        await sendEmail({
//            email: newUser.email,
//            subject: "your password reset token (valid for 10 min)",
//            message: messageMail
//        });
//
    res.status(201).json({
        status: "success",
        token: token,
        message: "Confirma tu cuenta, te enviamos un correo",
        data: {
            user: newUser
        }
    })
});

exports.confirmIdentity = catchAsync(async (req,res,next) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({confirmString: hashedToken});
    if(!user) {
        return next(new ApiErrors("im sorry, but that token is not valid", 404));
    }
    if(user.confirmStringExpiration < Date.now()){
        await User.findByIdAndDelete(user.id);
        return next(new ApiErrors("Has tardado mucho, crea una nueva cuenta", 410));
    }
    user.confirmed = true;
    user.confirmString = undefined;
    user.confirmStringExpiration = undefined;
    await user.save({validateBeforeSave: false});
    res.status(200).json({
        status: "success",
        message: "Felicidades, ahora puedes usar nuestra app, cierra esta pestaña"
    })
})

exports.login = catchAsync(async (req,res,next) => {
    if(req.headers.cookie){
        if(req.headers.cookie.includes("LotOfTries=")){
        return next(new ApiErrors("Espera 10 minutos para volver a intentarlo", 400));
        }
    }
    const {email, password} = req.body;
    const user = await User.findOne({email: email}).select("+password");

    if(!email || !password){
        return next(new ApiErrors("please provide a email and password", 400));
    }
    if(!user || !(await user.verificarContraseña(password,user.password))) {
        points.points = points.points - 1;

        if(points.points === 0){
            points.points = 5;
            res.cookie("LotOfTries", "error", {
                maxAge: 600000,
                secure: true,
                sameSite: "none"
            });
            return next(new ApiErrors("Demasiados intentos fallidos, debes esperar 10 minutos", 400));
        }
        return next(new ApiErrors("Contraseña incorrecta", 400));
    }
    points.points = 5;
    createSendToken(user,201, req,res);
});

exports.logout = (req,res) => {
    res.cookie("jwt", "logout", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });
    res.status(200).json({status: "success"});
}

exports.protect = catchAsync(async (req,res,next) => {
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else if(req.cookies.jwt){
        token = req.cookies.jwt;
    } else if(!req.cookies.jwt){
        token = req.query.jwt;
    }
    if(!token){
        return next(new ApiErrors("Wheres the token lowalski, WHERE IS THE GODAMN TOKEN", 401))
    }
    const decoded = await promisify(JWT.verify)(token,process.env.JWT_SECRET);
    const freshUser = await User.findById(decoded.id).select("+confirmed");
    if(!freshUser){
        return next(new ApiErrors("The user belonging to this token does no longer exist.", 401))
    }
    if(freshUser.contraseñaCambiada(decoded.iat)){
        res.clearCookie("jwt");
        return next(new ApiErrors("Tienes que volver a acceder", 401))
    };
    if(freshUser.confirmed === false){
        return next(new ApiErrors("Confirma tu cuenta, revisa tu correo electronico", 401));
    };
    req.user = freshUser;
    next();
});

exports.isLoggedIn = catchAsync(async (req,res,next) => {
    if(req.cookies.jwt){
        if(req.cookies.jwt === "he ded"){
            return next();
        }
        const decoded = await promisify(JWT.verify)(req.cookies.jwt,process.env.JWT_SECRET);
        const freshUser = await User.findById(decoded.id).select("+confirmed");
        if(!freshUser){
            return next();
        }
        res.locals.user = freshUser;
        return next();
    }
    next();
});

exports.restrict = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.rol)){
            return next(new ApiErrors("You cant do this kid, you are a junior, ask to your parent to do it", 403));
        }
        next();
    }
}
exports.forgotPass = catchAsync(async(req,res,next) => {
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new ApiErrors("No hay ningun usuario con ese correo", 404));
    }
    const resetToken = user.createPassResetToken();
    await user.save({validateBeforeSave: false});


    try{
//    await sendEmail({
//        email: user.email,
//        subject: "your password reset token (valid for 10 min)",
//        message
//    });
        const resetURL = `${process.env.URL_FRONT}/recuperar/${resetToken}`;

        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: "success",
            message: "Token sent to email succesfully"
        });
    } catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new ApiErrors("Hubo un error al intentar enviar el correo, intenta de nuevo"), 500);
    }
});
exports.resetPass = catchAsync(async(req,res,next) => {
    //usar template strings con el process.env
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}});
    if(!user){
        return next(new ApiErrors("Error! vuelva a intentar recuperar su cuenta", 400));
    }
    user.password = req.body.password;
    user.confirmarPassword = req.body.confirmarPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    createSendToken(user,201,req,res);
});

exports.updatePassword = catchAsync(async(req,res,next) => {
    const user = await User.findById(req.user.id).select("+password");
    if(!user || !await user.verificarContraseña(req.body.password, user.password)){
        return next(new ApiErrors("La contraseña actual no es correcta", 401))
    }
    user.password = req.body.newPassword;
    user.confirmarPassword = req.body.newPasswordConfirm;
    await user.save();

    createSendToken(user,201,req,res);
})

exports.remindUser = catchAsync(async (req,res,next) => {
    let token
    token = req.cookies.jwt;
    if(!req.cookies.jwt){
        console.log("si hay token 2");
        token = req.query.jwt;
    }
    if(!token){
        return next(new ApiErrors("Wheres the token lowalski, WHERE IS THE GODAMN TOKEN", 401))
    }
    const decoded = await promisify(JWT.verify)(token,process.env.JWT_SECRET);
    const freshUser = await User.findById(decoded.id);
    if(!freshUser){
        return next(new ApiErrors("The user belonging to this token does no longer exist.", 401))
    }
    res.status(200).json({
        status: "success",
        token: token,
        data: {
            user: freshUser
        },
        tarjeta: process.env.CARD
    })
});