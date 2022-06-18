const express = require("express");
const app = express();
const mongoose = require("mongoose")


/** CRON CODE LINE 18 */
const CronJob = require('cron').CronJob;

// DB Config:
const db = require("../config/keys");

//### Cron-Job Start
console.log('After job instantiation');
// const commonFunction = require('./routes/getApiData1');
// const job = new CronJob('* 58 23 * * *', commonFunction.setCronJob);
const job = new CronJob('*/10 * * * * *', commonFunction.setCronJob);
// job.start();


//Connect To MongoDB
// mongoose.connect( db.mongoURILocal, {userNewUrlParser: true}, function(err){
    mongoose.connect( db.mongoURILocal, function(err){
        if(err) {
            console.log("Error: Mongo Wasnt Connected because of: ", err);
        }
        else {
            console.log("MongoDB Connected");
        }
    });

app.use("/", function(req, res, next) {
    configureRoutes(req, res, next, app);
})
app.use(errorhandler());
app.use(function (err, req, res, next){
    console.log("-------------------" + err.stack)
    return res.status(500).send({
        success: false,
        error: true,
        message: err.message,
        data: []
    });
})
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    // res.status(500).send('Unknown Error');
    // Application specific logging, throwing an error, or other logic here
});