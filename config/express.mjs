import { resolve } from "path";
import express from "express"
import favicon from "serve-favicon"
import { engine as exphbs } from "express-handlebars";
import cookieParser from "cookie-parser";

var env = process.env.NODE_ENV || "development";

export default function configureExpress(app) {
  app.use((req, res, next) => {
    res.setHeader('X-GNU', 'Michael J Blanchard');
    next();
  });
  // Enforce HTTPS in production
  if (env === 'production') {
    app.use((req, res, next) => {
      res.setHeader('Strict-Transport-Security', 'max-age=2592000; includeSubdomains'); // Enforce usage of HTTPS; max-age = 30 days
      next();
    });
  }
  app.use(express.static(resolve('public')));
  app.use(cookieParser());
  app.use(favicon(resolve('public/favicon.ico')));

  var hbs = exphbs({
    defaultLayout: 'main',
    extname: '.hbs'
  });

  app.engine('.hbs', hbs);
  app.set('view engine', '.hbs');
};
