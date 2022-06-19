const express = require("express");
const axios = require("axios");
const router = express.Router();
const {parse} = require('node-html-parser');
const cheerio = require("cheerio");
const NaukriDotCom = require("../../models/NaukriData");
const Company_Model = require("../../models/company");
const Company_Data_Model = require("../../models/companyData");
const Job_Model = require("../../models/job");
const Job_Data_Model = require("../../models/jobData");
// const Job_Model1 = require("../../models/job1");
const formatDateCollection =  (date) => {
  let d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  //return [year, month, day].join('-');
  return [day, month, year].join('/');
}

getDataNaukriDotCom = async (req,res) =>{
    const d = new Date();
    console.log('Midnight');

    let pageCount = 1;
    let countTotalJobs = 0;
    let delay = 6000;
    let dataNotSavedCount = 0;
    let dupDataCount = 0;
    let numberOfResult = 0;
    let index = 0;
    let searchByKeyword = ['Commi 3','Commi 2','Commi 1','DCDP','CDP','Sr. CDP','Junior Sous Chef','Sous Chef'];
    let searchKey= 'Head Chef';
    // let lowerSearchKey = searchKey.toLowerCase();
    let interval = setTimeout(async function intervalTime() {
      const options = {
        method: 'GET',
        url: 'https://www.naukri.com/jobapi/v3/search?noOfResults=500&urlType=search_by_keyword&searchType=adv&keyword='+searchKey+'&pageNo='+pageCount+'&k='+searchKey+'&seoKey='+searchKey+'-jobs&src=jobsearchDesk&latLong=',
        headers: {
          'appid': '109',
          'clientId': 'd3skt0p',
          'systemid': '109'
        }
      };
          
        let today = new Date();
        let date = await formatDateCollection(today);
        await axios.request(options).then(async function (response) {
            console.log('getDataNaukriDotCom')
            let noOfJobs = response.data.noOfJobs;
            numberOfResult = (noOfJobs/500).toFixed();
            delay = 6000
            let jobDetails = response.data?.jobDetails ? response.data.jobDetails : [];
            countTotalJobs= jobDetails ? (countTotalJobs+jobDetails.length) : countTotalJobs
            console.log("jobDetails",jobDetails?.length);
            console.log("number of job",response.data?.noOfJobs);
            console.log("pagecount",pageCount);
            // console.log("countTotalJobs",countTotalJobs);
            if(jobDetails.length > 0){
              let companyObj = [];
              let uniqueCompany = [];
              let jobObj = [];
              let uniqueJob = [];
              await jobDetails.forEach(async (jobData1)=>{
                  companyObj.push({
                    companyId: jobData1.companyId,
                    ambitionBoxData: jobData1.ambitionBoxData,
                    companyName: jobData1.companyName,
                  });
                  let newObj = {};
                  newObj.experience = jobData1.placeholders[0].label;
                  newObj.salary = jobData1.placeholders[1].label;
                  newObj.location = jobData1.placeholders[2].label;
                  jobObj.push({
                    jobId: jobData1.jobId,
                    source:"naukri_com",
                    keyword:searchKey,
                    title: jobData1.title,
                    companyId: jobData1.companyId,
                    ambitionBoxData: jobData1.ambitionBoxData,
                    companyName: jobData1.companyName,
                    jobType: jobData1.jobType,
                    currency: jobData1.currency,
                    footerPlaceholderLabel: jobData1.footerPlaceholderLabel,
                    // footerPlaceholderColor: jobData1.footerPlaceholderColor,
                    tagsAndSkills: jobData1.tagsAndSkills?jobData1.tagsAndSkills.split(',') :[],
                    placeholders: newObj,
                    jdURL: jobData1.jdURL,
                    staticUrl: jobData1.staticUrl,
                    jobDescription: jobData1.jobDescription,
                    // showMultipleApply: jobData1.showMultipleApply,
                    // isSaved: jobData1.isSaved,
                    // groupId: jobData1.groupId,
                    // isTopGroup: jobData1.isTopGroup,
                    postAtDate1: new Date(parseInt(jobData1.createdDate)),
                  })
              })
              console.log('company_Object==>',companyObj.length)
              // if(uniqueJob.length>0){
                let data = new Map();
                  for (let obj of companyObj) {
                      data.set(obj.companyId, obj);
                  }
                  uniqueCompany = [...data.values()];
                    console.log('uniqueCompany length===>',uniqueCompany.length)
                
                console.log('jobObj_Object==>',jobObj.length)
                // console.log('companObject==>',companyObj)
                let data1 = new Map();
                  for (let obj of jobObj) {
                      data1.set(obj.jobId, obj);
                  }
                  uniqueJob = [...data1.values()];
                  dupDataCount+=jobObj.length-uniqueJob.length;
                  console.log('uniqueJob length===>',uniqueJob.length)
                  
                  insertCompanyData(uniqueCompany).then(async (resData)=>{
                    let totalNotsave = await insertJobNaukriData(uniqueJob);
                    dataNotSavedCount+=totalNotsave;
                  });
              // }

              console.log('the End')
            }else{
              console.log("job details length is 0",response.data?.noOfJobs);
            }
            if(numberOfResult <= pageCount){
              console.log("numberofResult>>>",numberOfResult,"<<<page count",pageCount);
              stopTimeInterval(res);
            }else{
              interval = setTimeout(intervalTime, delay);
            }   
            pageCount++;
          })
          .catch(function (error) {
            console.error("error",error);
              console.error("error Page pageCount",pageCount);
              console.error("error Page numberOfResult",numberOfResult);
              if(delay != 10000){
                delay = 10000
              }else{
                pageCount++
              }
              interval = setTimeout(intervalTime, delay);
          });
    }, delay);
    function stopTimeInterval(res){
      console.log("Stop function called");
      clearInterval(interval);
      console.log("Stop function End");
      return res.send({success:true,message:"data inserted"});
    }
}


insertCompanyData = async (uniqueCompany)=>{
  let exists=0;
  let notExists=0;
  let comapanyData = await Promise.all(uniqueCompany.map(async (jobData) => {
      const data = await Company_Data_Model.findOne({ companyId: jobData.companyId }).then(async(data)=>{
      if(data){
        exists++;
        // company exists
        console.log("company exists");
        let ambitionBoxData = jobData.ambitionBoxData == undefined ? data.ambitionBoxData : jobData.ambitionBoxData;
        if(jobData.ambitionBoxData != undefined){
          await Company_Data_Model.updateOne({ _id: data._id }, { $set: {ambitionBoxData: ambitionBoxData} }).then(async(companyUpdateRes)=>{
            console.log("Company updated");
          }).catch(err => console.log("company update error"))
        }
      }
      else{
        notExists++;
        //Company not Exists Company
        console.log("company not exists");
        // adding data to company model        
        let companyObj = {
          companyId: jobData.companyId,
          ambitionBoxData: jobData.ambitionBoxData ? jobData.ambitionBoxData : {},
          companyName: jobData.companyName,
        }
        let companyModel = new Company_Data_Model(companyObj);
        await companyModel.save().then((res)=>{console.log("<===company saved===>")}).catch(error => console.log("comapany save error",error))
      }
    })
  }))
  console.log('notExists===>',notExists)
  console.log('exists===>',exists)
  return comapanyData;
}

insertJobNaukriData = async(uniqueJob)=>{
  let ExiststJob =0;
  let NotExistsJob =0;
  let jobDatas = await Promise.all(uniqueJob.map(async (jobData) => {
    await Job_Data_Model.findOne({jobId:jobData.jobId}).then(async(jobDataInsert)=>{
      if(jobDataInsert){
        ExiststJob++;
      }else{
        NotExistsJob++;
        const data = await Company_Data_Model.findOne({ companyId: jobData.companyId }).then(async(data)=>{
          let jobSaveObj = {
            source: jobData.source,
            keyword: jobData.keyword,
            title: jobData.title,
            jobId: jobData.jobId,
            jobType: jobData.jobType,
            currency: jobData.currency,
            footerPlaceholderLabel: jobData.footerPlaceholderLabel,
            tagsAndSkills: jobData.tagsAndSkills,
            placeholders: jobData.placeholders,
            jdURL: jobData.jdURL,
            staticUrl: jobData.staticUrl,
            jobDescription: jobData.jobDescription,
            postAtDate: jobData.postAtDate1,
            companyRefId: data._id,
          }
          let jobModel = new Job_Data_Model(jobSaveObj);
          await jobModel.save().then(async (result)=>{console.log('data save job')}).catch(error => console.log("job save error",error))
        }).catch((error)=>{console.log('job error',error)})
      }
    }).catch((error)=>{console.log('outer job error')})
  }))
  console.log('ExiststJob==>',ExiststJob)
  console.log('NotExistsJob==>',NotExistsJob)
  return ExiststJob;
}

module.exports = {getDataNaukriDotCom};