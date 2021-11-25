const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const { celebrate, Joi, errors } = require("celebrate");
const helmet = require("helmet");
const NotFoundError = require("./errors/not-found-err");
const { requestLogger, errorLogger } = require("./middlewares/logger");
const corsMiddleware = require("./middlewares/cors-defend");

const app = express();

const { login, createUser } = require("./controllers/users");
const auth = require("./middlewares/auth");
const errorHandler = require("./middlewares/error");

const { PORT = 3001 } = process.env;

mongoose.connect("mongodb://localhost:27017/bitfilmsdb", {
  useNewUrlParser: true,
});

app.use(require("./middlewares/rate-limiter"));

app.use(express.json());

app.use(corsMiddleware);

app.use(requestLogger);

app.use(helmet());

app.post(
  "/signup",
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().min(2).max(30),
      email: Joi.string().email().required(),
      password: Joi.string().required().min(8).max(35),
    }),
  }),
  createUser,
);

app.post(
  "/signin",
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),
  login,
);

app.use(auth);

app.use("/", require("./routes/users"));
app.use("/", require("./routes/movies"));

app.use("*", (req, res, next) => next(new NotFoundError("Ресурс не найден.")));

app.use(errorLogger);

app.use(errors());

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Ссылка на сервер: http://localhost:${PORT}`);
});
