const NaukriData = require('../../models/NaukriData')
const Job_Model = require("../../models/job");
const Job_New_Model = require("../../models/jobData")
const Company_New_Model = require("../../models/companyData")
/*
 *  Get Dashboard Data
 */

exports.getDashboardData = async (req,res) => {
    console.log('in getDashboardData')
    return res.status(200).json({
        success: true,
        messages: 'data not found',
        data: {}
    })
}

exports.getAllData = async(req,res) => {  
  res.header("Access-Control-Allow-Origin","*");     
  await Job_Model.aggregate([
    {
      $lookup:{ 
        from: 'companies', 
        localField:'companyRefId', 
        foreignField:'_id',
        as:'companyDetails',
          pipeline: [{ $project: { companyId: 1, companyName: 1,ambitionBoxData:1 }}],
      },
    },
    { $sort: { jobId: -1 } }
  ]).limit(16).then((result)=>{
    if (result) {
      console.log('caling Api=>');
      // res.setHeader('Acces-Control-Allow-Origin','*');
      return res.send({data:result,success:true,message:"data get"});
    }
  })
}

exports.searchByCityName = async(req,res) => {
  console.log(req.params.cityName)
  await Job_Model.aggregate([
    {
      $lookup:{ 
        from: 'companies', 
        localField:'companyRefId', 
        foreignField:'_id',
        as:'companyDetails',
          pipeline: [
            { $project: { companyId: 1, companyName: 1,ambitionBoxData:1 } }
          ],
      },
    }
  ]).limit(5).then((result)=>{
    if (result) {
        console.log(result);
        return res.send({data:result,success:true,message:"data inserted"});
    }
  })
}

//search by keyword data
exports.searchByKeyword = async(req,res) => {
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,application/json, text/plain"
    ),
    res.header('Access-Control-Allow-Methods','GET,PUT,PATCH,POST,DELETE,OPTIONS')
  console.log('<== searchByKeyword ==>')
  // console.log('regex=',regex)
  let keywordJobs = {} ;
  let searchByKeyword = req.params.searchByKeyword.toLowerCase();
  let key = searchByKeyword.replace(/(^|\s)\S/g, letter => letter.toUpperCase());
    await Job_Model.aggregate([
      {
        '$match': {
          'keyword': key
        }
      }, {
        '$lookup': {
          'from': 'companies', 
          'localField': 'companyRefId', 
          'foreignField': '_id', 
          'as': 'companiesData',
          pipeline: [
            { $project: { companyId: 1, companyName: 1,ambitionBoxData:1 } }
          ],
        }
      },
      { $sort: { jobId: -1 } }
    ]).limit(16).then((result)=>{    
      console.log('result length',result.length)
      keywordJobs = {
        keyword:req.params.searchByKeyword,
        totalJobs:result.length
      }
    // res.headers('Acces-Control-Allow-Origin','*');
    return res.send({data:result,keywordJobs,success:true,message:"data fetch by keyword"});
  }).catch((error)=>console.log(error))
}

//search keyword and total jobs count
exports.keywordAndCountJobs = async(req,res) => {
  res.header("Access-Control-Allow-Origin","*");
  console.log('<== keywordAndCountJobs ==>')
    await Job_Model.aggregate([
      { "$group": {
          "_id": { "$toUpper": "$keyword" },
          "count": { "$sum": 1 }
      } },
      { "$group": {
          "_id": null,
          "keywordData": {
            "$push": {"keyword":"$_id","totalJobs":"$count"},
          }
      } },
  ]).then((result)=>{    
      console.log('result==>',result)
      let data = result.length != 0 ? result[0].keywordData : [];
      // sort by salary
      data.sort(function (x, y) {
        return y.totalJobs - x.totalJobs;
      });

      console.table(data);
      // let data = result.toUpperCase();
    return res.send({data:data,success:true,message:"data fetch by keyword"});
  }).catch((error)=>console.log(error))
}

exports.getTop100Company = async(res)=>{
  console.log('topCompanyRefId')
  let topCompanyRefId = [];
  const data = await Job_Model.aggregate([
    {
      '$group': {
        '_id': {'_id': '$companyRefId'}, 
        'count': {'$sum': 1}
      }
    }, {
      '$match': {
        'count': {'$gte': 42}
      }
    }
  ]);

  if (topCompanyRefId.length == 0) {
      // return res.status(200).json({ statusCode: 0, message: "data not available!", data: {} });
      console.log('data not available')
  }

  for (let i = 0; i < data.length; i++) {
      // if (!topCompanyRefId.includes(distinctAreas[i].areas.label)) {
          // topCompanyRefId.push(data[i]._id);
          topCompanyRefId.push(data[i]);
      // }
      // console.log('topCompanyRefId==>',data[i])
  }
    console.log('topCompanyRefId length==>',topCompanyRefId)
    console.log('topCompanyRefId length==>',topCompanyRefId.length)

}

exports.searchByCompanyName = async(req,res) => {
    console.log('searchByCompanyName',req.params.companyName);
    var regex = new RegExp(req.params.companyName,'i')
    let companyName = req.params.companyName;
    // console.log(regex)
    await NaukriData.find({},
        {
          "jobDetails": {
            $filter: {
              input: "$jobDetails",
              cond: {
                "$eq": ["$$this.companyName",companyName]
              }
            }
          }
        })
    .then((response) => {
        console.log('response==>%j',response);
    }).catch((err) => {
        return false;
    });;
}
