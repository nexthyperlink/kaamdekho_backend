// import "reflect-metadata";

const express = require('express');
const mongoose = require("mongoose");
const http = require('http');
const errorhandler = require('errorhandler');
const cors = require('cors');
const app = express();
const CronJob = require('cron').CronJob;
const cron = require("node-cron");

const dashboard = require("./routes/api/dashboard");
const getDataOnApi = require("./routes/api/getDataOnApi");

app.use("/api/dashboard",dashboard);
app.use("/api/getDataOnApi",getDataOnApi);

app.use(express.json());
/** CRON CODE LINE 18 */
// app.use(cors());
// enable cors to the server
app.use(cors()); // cors for all the routes of the application


// DB Config:
const db = require("./config/keys");

//Connect To MongoDB
// mongoose.connect( db.mongoURILocal, {userNewUrlParser: true}, function(err){
    mongoose.connect("mongodb+srv://admin:NgjCANrBLjnCnjwy@cluster0.egqjw.mongodb.net/auth?retryWrites=true&w=majority").then(()=>{
        app.listen(4000);
        console.log('Database is connected! Listening to localhost 4000');
    }).catch((err) => console.log(err));

//### Cron-Job Start
console.log('After job instantiation');
// const commonFunction = require('./routes/api/getDataOnApi');
// const job = new CronJob('* 58 23 * * *', commonFunction.setCronJob);
// const job = new CronJob('*/2 * * * *', commonFunction.setCronJob);
// job.start();

// app.use("/", function(req, res, next) {
//     configureRoutes(req, res, next, app);
// })
// app.use(errorhandler());
// app.use(function (err, req, res, next){
//     console.log("-------------------" + err.stack)
//     return res.status(500).send({
//         success: false,
//         error: true,
//         message: err.message,
//         data: []
//     });
// })

app.get('/',function(req,res){
    res.send('Hello User ...... !\n');
})
app.use((req, res, next) =>{
    const error = new Error('Page Not found ');
    // error.status = 404;
    next(error);
});
app.use( (error, req, res, next) =>{
    res.status(error.status || 500);
    res.json({
        message:  error.message
    })
});

// Listening
// const port = 4000
// app.listen(port, () => console.log(`Server Running on port ${port}`));


// process.on('unhandledRejection', (reason, promise) => {
//     console.log('Unhandled Rejection at:', promise, 'reason:', reason);
//     // res.status(500).send('Unknown Error');
//     // Application specific logging, throwing an error, or other logic here
//   });

//   const httpServer = http.createServer(app);
//   httpServer.listen(4000, ()=>{
//     console.log('HTTP Server running on port 4000');
//   });