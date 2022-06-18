const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CompanySchema = new Schema({
    companyId: {type : Number,unique: true},
    companyName: {type : String},
    ambitionBoxData: {type : Object, default:{}}
},{timestamps: true}) 

module.exports = CompanyData = mongoose.model("companieData", CompanySchema)

