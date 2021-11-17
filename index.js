const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: './config.env' });

mongoose.connect(process.env.DB_MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {});

process.on("unhandledRejection", err => {
    console.log(err)
    server.close(() => {
    process.exit(1);
    });
});

process.on("SIGTERM", () => {
    server.close(() => {
    })
})