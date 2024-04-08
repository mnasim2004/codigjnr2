var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv=require('dotenv');
var session=require('express-session');

// const exphbs = require('express-handlebars');
// const Handlebars = require('handlebars');
const app = express();
// // Register custom Handlebars helper function to check if progress is zero
// Handlebars.registerHelper('isProgressZero', function(progress) {
//   return progress === 0;
// });

// // Register custom Handlebars helper function to check if two values are equal
// Handlebars.registerHelper('eq', function(a, b, options) {
//   return a === b ? options.fn(this) : options.inverse(this);
// });

// // Set up express-handlebars as the view engine
// app.engine('handlebars', exphbs({
//     defaultLayout: 'main', // Specify the default layout file
//     helpers: {
//         // Register helpers directly within exphbs setup
//         isProgressZero: function(progress) {
//             return progress === 0;
//         },
//         eq: function(a, b, options) {
//             return a === b ? options.fn(this) : options.inverse(this);
//         }
//     }
// }));
// app.set('view engine', 'handlebars');


const mysql= require ("mysql");
const db= mysql.createConnection({
  host:"localhost",
  user:"root",
  password:"",
  database:""

})

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
dotenv.config()

// view engine setup
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret:"Key",cookie:{maxAge:60000}}))
//const { s3Uploadv2, s3Uploadv3 } = require("./s3Service");

app.use(express.static(path.join(__dirname, '/')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });


app.listen(5000, () => {
  console.log("Server running on port{5000}");
      });


module.exports = app;

