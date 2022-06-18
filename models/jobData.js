const mongoose = require('mongoose')
const Schema = mongoose.Schema

const JobSchema = new Schema({
    jobId: {type : Number,unique : true},
    title: {type: String},
    source: {type: String},
    keyword: {type: String},
    jobType: {type: String},
    currency: {type : String },
    footerPlaceholderLabel: {type : String },
    // footerPlaceholderColor: {type : String },
    tagsAndSkills: {type : Array, "default": []  },
    placeholders: {type : Object, default:{}},
    jdURL: {type : String },
    staticUrl: {type : String },
    jobDescription: {type : String },
    // showMultipleApply: {type : Boolean},
    // isSaved: {type : Boolean},
    // groupId: {type : Number},
    // isTopGroup: {type : Number},
    postAtDate: { type: Date, trim: true },
    companyRefId: {type: Schema.Types.ObjectId, ref: 'companies'}
},{timestamps: true}) 

module.exports = mongoose.models.jobData || mongoose.model('jobData', JobSchema);
