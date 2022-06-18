const mongoose = require('mongoose')
const Schema = mongoose.Schema

const NaukriDotComSchema = new Schema({
    noOfJobs: {type: Number},
    clusters: {type : Object },
    date: { type: String, trim: true },
    jobDetails: {type : Object },
    fatFooter: {type : Object },
    suggesterModel: {type : Object },
    seo: {type : Array},
    bellyFilters: {type : Object },
    sid: {type : Number},
    isLoggedIn: {type : Boolean},
    variantName: {type : String},
    clusterOrder: {type : Array}
},{timestamps: true}) 

module.exports = NaukriDotCom = mongoose.model("naukri_Data", NaukriDotComSchema)

