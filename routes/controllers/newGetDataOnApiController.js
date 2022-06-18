const express = require("express");
const axios = require("axios");
const router = express.Router();
const {parse} = require('node-html-parser');
const cheerio = require("cheerio");
const { color, log } = require('console-log-colors');
const { red, green, cyan } = color;
const clc = require('cli-color');
const Company_Model = require("../../models/Company");
//for naukri dot com
const Company_Data_Model = require("../../models/companyData");
const Job_Data_Model = require("../../models/jobData");
//for linkedin
const Company_Data_Model_LinkedIn = require("../../models/linkedin_companies");
const Job_Data_Model_LinkedIn = require("../../models/linkedlin_job");
const Job_Model = require("../../models/Job");
// const Job_Model1 = require("../../models/job1");

let interval;
getDataNaukriDotCom = async (req,res) =>{
    console.log('Naukri Dot Com');
    let searchByKeyword = [
      'Indian Curry','Indian tandoor','Chinese','Thai','Japanese','South Indian','Italian','Mexican','F&B Service',
    ];
    // 'bar','Houskeeping','Front Office','Reservation','Sales and marketing','Oriental','Kitchen Stewarding',
    //   'tandoor chef','Indian Curry chef','Chiness chef','chef manager','hotel manager',
    //   'learning development manager','training and development','Casual Dining',

    let searchIndex = 0;
    // let requests = searchByKeyword.map((KEYWORD) => {
    function callback(){
      const promiseHandle = new Promise(async (resolve) => {
        console.log('<=== keyword loop START ===>',searchByKeyword[searchIndex])
        //store data naukri_com
        await keywordWiseDataStoreNaukri_com(searchByKeyword[searchIndex])
        console.log('<=== keyword loop END ===>',searchByKeyword[searchIndex])
        if(searchIndex == searchByKeyword.length-1){
          resolve();
          console.log('all resolved');
          stopTimeInterval(res);
        }else{
          searchIndex++;
          callback();
        }
      });
    }
    // })
    callback();

    // let requests = searchByKeyword.map((searchKey) => {
    //   return new Promise((resolve) => {
    //     console.log('<=== keyword loop START ===>',searchKey)
    //     //store data naukri_com
    //     keywordWiseDataStoreNaukri_com(searchKey, resolve)
    //     console.log('<=== keyword loop END ===>',searchKey)
    //   });
    // })
    
    // Promise.all(requests).then(() => {
    //   console.log('all resolved');
    //   stopTimeInterval(res);
    // });
}

keywordWiseDataStoreNaukri_com = async (searchKey,cb)=>{
  return new Promise((resolve, reject) => {
  let pageCount = 1;
  let countTotalJobs = 0;
  let delay = 6000;
  let dataNotSavedCount = 0;
  let dupDataCount = 0;
  let numberOfResult = 0;
  let index = 0;
    interval = setTimeout(async function intervalTime() {
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
                    footerPlaceholderColor: jobData1.footerPlaceholderColor,
                    tagsAndSkills: jobData1.tagsAndSkills?jobData1.tagsAndSkills.split(',') :[],
                    placeholders: newObj,
                    jdURL: jobData1.jdURL,
                    staticUrl: jobData1.staticUrl,
                    jobDescription: jobData1.jobDescription,
                    showMultipleApply: jobData1.showMultipleApply,
                    isSaved: jobData1.isSaved,
                    groupId: jobData1.groupId,
                    isTopGroup: jobData1.isTopGroup,
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
                  
                  insertCompanyDataNaukri(uniqueCompany).then(async (resData)=>{
                    let totalNotsave = await insertJobDataNaukri(uniqueJob);
                    dataNotSavedCount+=totalNotsave;
                  });
              // }

              console.log('the End')
            }else{
              console.log("job details length is 0",response.data?.noOfJobs);
            }
            if(numberOfResult <= pageCount){
              console.log("numberofResult>>>",numberOfResult,"<<<page count",pageCount);
              // stopTimeInterval(res);
              //   cb();
              // return response;
              resolve();
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
  })
}

insertCompanyDataNaukri = async (uniqueCompany)=>{
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

insertJobDataNaukri = async(uniqueJob)=>{
  let ExiststJob =0;
  let NotExistsJob =0;
  let jobDatas = await Promise.all(uniqueJob.map(async (jobData) => {
    await Job_Data_Model.findOne({jobId:jobData.jobId}).then(async(jobDataInsert)=>{
      if(jobDataInsert){
        ExiststJob++;
        if(jobDataInsert.keyword.includes(jobData.keyword)){console.log('keys already match job==>')}
        else{
          let dataOldKey = jobDataInsert.keyword;
          let updatekey = dataOldKey;
          updatekey.push(jobData.keyword);
          await Job_Data_Model.updateOne({ _id: jobDataInsert._id }, { $set: {keyword: updatekey} }).then(async(companyUpdateRes)=>{
            console.log("key updated",jobDataInsert.jobId);
          }).catch(err => console.log("key update error"))
        }
      }else{
        NotExistsJob++;
        const data = await Company_Data_Model.findOne({ companyId: jobData.companyId }).then(async(data)=>{
          let keySearch = [];
          keySearch.push(jobData.keyword);
          let jobSaveObj = {
            source:jobData.source,
            keyword:keySearch,
            title: jobData.title,
            jobId: jobData.jobId,
            jobType: jobData.jobType,
            currency: jobData.currency,
            footerPlaceholderLabel: jobData.footerPlaceholderLabel,
            footerPlaceholderColor: jobData.footerPlaceholderColor,
            tagsAndSkills: jobData.tagsAndSkills,
            placeholders: jobData.placeholders,
            jdURL: jobData.jdURL,
            staticUrl: jobData.staticUrl,
            jobDescription: jobData.jobDescription,
            showMultipleApply: jobData.showMultipleApply,
            isSaved: jobData.isSaved,
            groupId: jobData.groupId,
            isTopGroup: jobData.isTopGroup,
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

getDataLinkdin = async (req,res) => {
  let searchByKeyword = ['Captain','Food and Beverage Executive','Front Office manager','Duty manager',];
  let searchIndex = 0;
  // let jobIdGlobal;
    function callback(){
      const promiseHandle = new Promise(async (resolve) => {
        console.log(clc.green('<=== keyword loop START ===>',searchByKeyword[searchIndex],searchIndex));
        //store data naukri_com
        await keywordWiseDataStoreLinkedin(searchByKeyword[searchIndex])        
        // console.log('jobIds jobIds=>',jobIds)
        console.log(clc.green('<=== keyword loop END ===>',searchByKeyword[searchIndex],searchIndex));
        if(searchIndex == searchByKeyword.length-1){
          resolve();
          console.log('all resolved');
          stopTimeInterval(res);
        }else{
          searchIndex++;
          callback();
        }
      });
    }
    callback();
}

keywordWiseDataStoreLinkedin = async (KEYWORD)=>{
  let jobIdsGlobal;
  return new Promise(async(resolve, reject) => {
      const preConfig = {
        method: "get",
        url: `https://in.linkedin.com/jobs/search?keywords=${KEYWORD}&geoId=102713980&f_TPR=&distance=100&position=1&pageNum=0`,
      };
      const jobIds = new Set();
      const failedFetches = new Set();
      let limits = 100;
      await axios(preConfig).then(async(preResponse)=>{
        let cookies = preResponse.headers["set-cookie"];
        const preConfigResolve = new Promise(async (resolve) => {
          let preConfigIndex = 0 ;
          async function preConfigFun (){
            console.log('in fun preConfigIndex==>',preConfigIndex)
            console.log("START", jobIds.size);
            // console.time("GET JOB POSTS");
            var config = {
              method: "get",
              url: `https://in.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${KEYWORD}&locationId=&geoId=102713980&f_TPR=&start=${jobIds.size}`,
              headers: {},
            };
            let urn = "";
            let linkUrl = "";
            try {
              const response = await axios({
                ...config,
                headers: { ...config.headers, Cookie: cookies },
              }).then(async function (response){
                // console.timeEnd("GET JOB POSTS");
                const html = response.data;
                const root = parse(html);
                console.log("JOB POSTS COUNT", root.querySelectorAll("li").length);
                const childNodes = root.querySelectorAll(".base-card");
                let childNodesIndex = 0;
                let jobDetails = [];
                const childNodeResolve = new Promise(async (resolve) => {
                  const childNodesFun = async ()=>{
                    let jobPost = {};
                    urn = childNodes[childNodesIndex].attributes?.["data-entity-urn"];
                    const title = childNodes[childNodesIndex].querySelector(".base-search-card__title");
                    const link = childNodes[childNodesIndex].querySelector(".base-card__full-link");
                    jobPost.title = title.innerHTML.trim();
                    jobPost.link = link
                      ? link.attributes["href"]
                      : childNodes[childNodesIndex].attributes["href"];
                    linkUrl = jobPost.link;
                    const companyName = childNodes[childNodesIndex].querySelector(
                      ".base-search-card__subtitle"
                    );
                    const isHref = companyName.querySelector("a");
                    if (isHref) {
                      jobPost.companyName = isHref.innerHTML.trim();
                    } else {
                      jobPost.companyName = companyName.innerHTML.trim();
                    }
                    const location = childNodes[childNodesIndex].querySelector(".job-search-card__location");
                    jobPost.location = location?.innerHTML.trim();
                    const postedAt = childNodes[childNodesIndex].querySelector("time");
                    jobPost.postedAt = postedAt.attributes["datetime"];
                    // console.log(jobPost);
                    if (jobPost.link) {
                      console.log('GET JOB DETAIL START');
                      const linkConfig = { method: "get", url: jobPost.link };
                      await axios(linkConfig).then((linkResponse)=>{
                        const linkRoot = parse(linkResponse.data, { comment: true });
                        const metaTags = linkRoot
                          .querySelectorAll("meta")
                          ?.filter((tag) =>
                            ["companyId", "titleId", "industryIds"].includes(
                              tag.attributes["name"]
                            )
                          );
                        const jobId = linkRoot.querySelector("#decoratedJobPostingId");
                        const easyLink = linkRoot.querySelector("#wwwEasyApplyUrl");
                        const scriptTags = linkRoot.querySelectorAll("script");
                        const dataTag = scriptTags.filter(
                          (tag) => tag.attributes?.["type"] === "application/ld+json"
                        );
                        const otherTags = {
                          companyId: undefined,
                          titleId: undefined,
                          industryIds: undefined,
                        };
                        metaTags.forEach(
                          (tag) =>
                            (otherTags[tag.attributes["name"]] = tag.attributes["content"])
                        );
                        if (dataTag && dataTag[0]) {
                          const stringified = dataTag[0].childNodes[0]?.innerText;
                          jobPost.detail = JSON.parse(stringified);
                          jobPost.detail = {
                            ...jobPost.detail,
                            ...otherTags,
                            jobId: jobId?.innerText,
                            easyLink: easyLink?.innerText?.replace('"', "").replace('"', ""),
                          };
                          jobIds.add(jobId?.innerText);
                        }
                        // console.timeEnd("GET JOB DETAIL END");
                        // wait(3000);
                      }).catch((error)=>{
                        console.log('catch linkResponse error',error)
                      })
                    }
                    // console.log(jobPost);
                    jobDetails.push(jobPost);
                    if(childNodesIndex == childNodes.length-1){
                      resolve();
                    }else{
                      childNodesIndex++;
                      await childNodesFun();
                    }
                  }
                  childNodesFun();
                })
                await childNodeResolve.then((data)=>{
                  console.log('promise handle')
                })
                console.log("jobIdsGlobal=>",jobIdsGlobal,"jobIds.size=>",jobIds.size)
                if(jobIdsGlobal == jobIds.size){
                  console.log(clc.blue('out of network'))
                  resolve();
                  return;
                }
                console.log(clc.red('if k niche'));
                jobIdsGlobal = jobIds.size;
                if(jobDetails.length > 0){
                  let companyObj = [];
                  let uniqueCompany = [];
                  let jobObj = [];
                  let uniqueJob = [];
                  await jobDetails.forEach(async (jobData1)=>{
                    // if(jobData1.companyName != undefined || jobData1.detail.companyId != undefined){
                      companyObj.push({
                        companyId: jobData1.detail.companyId?jobData1.detail.companyId:'',              
                        companyName: jobData1.companyName,
                      });
                  
                      jobObj.push({
                        jobId: jobData1.detail.jobId?jobData1.detail.jobId:'',
                        title: jobData1.title?jobData1.title:'',
                        link: jobData1.link?jobData1.link:'',
                        source:"linkedin",
                        keyword:KEYWORD,
                        location: jobData1.location?jobData1.location:'',
                        postedAt: jobData1.postedAt?jobData1.postedAt:'',
                        context: jobData1.detail.context?jobData1.detail.context:'',
                        type: jobData1.detail.type?jobData1.detail.type:'',
                        datePosted: jobData1.detail.datePosted?jobData1.detail.datePosted:'',
                        description: jobData1.detail.description?jobData1.detail.description:'',
                        employmentType: jobData1.detail.employmentType?jobData1.detail.employmentType:'',
                        hiringOrganization: jobData1.detail.hiringOrganization?jobData1.detail.hiringOrganization:{},
                        identifier: jobData1.detail.identifier?jobData1.detail.identifier:{},
                        image: jobData1.detail.image?jobData1.detail.image:'',
                        industry: jobData1.detail.industry?jobData1.detail.industry:'',
                        jobLocation: jobData1.detail.jobLocation?jobData1.detail.jobLocation:{},
                        skills: jobData1.detail.skills?jobData1.detail.skills:'',
                        validThrough: jobData1.detail.validThrough?jobData1.detail.validThrough:'',
                        educationRequirements: jobData1.detail.educationRequirements?jobData1.detail.educationRequirements:{},
                        companyId: jobData1.detail.companyId?jobData1.detail.companyId:'',
                        titleId: jobData1.detail.titleId?jobData1.detail.titleId:'',
                        industryIds: jobData1.detail.industryIds?jobData1.detail.industryIds:'',
                        easyLink: jobData1.detail.easyLink?jobData1.detail.easyLink:'',
                        companyName: jobData1.detail.companyName?jobData1.detail.companyName:'',
                      })
                    // }else{console.log('company undefined')}
                  })
                  console.log('company_Object==>',companyObj.length)
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
                  // console.log('uniqueJob  ===>',uniqueJob)
                  console.log('uniqueJob length===>',uniqueJob.length)
                  
                  insertCompanyDataLinkedin(uniqueCompany).then(async (resData)=>{
                      let totalNotsave = await insertJobDataLinkedin(uniqueJob);
                  });
                  console.log('the End')
                  if(limits != preConfigIndex+1){
                    preConfigIndex++;
                    console.log('limit is not equal to index==>',preConfigIndex)
                    preConfigFun();
                  }else{
                    console.log('limit is equal to index==>',preConfigIndex)
                    resolve();
                  }
                }else{
                  console.log("job details length is 0");
                  // i=limits; 
                  resolve();
                }
              }).catch((err)=>{
                console.log('in api error=>',err)
              })
              // console.log(failedFetches);
            } catch (error) {
              console.log("URN:", urn);
              failedFetches.add(linkUrl);
            }
            // if(i==limits-1){resolve()}
          }
          preConfigFun();
        })
        await preConfigResolve.then(async()=>{
          console.log('<== pre Config Resolve ==>')
          resolve();
        }).catch((err)=>{console.log('pre Config Resolve catch',err)})
        console.log(failedFetches);
      }).catch((er)=>{
        console.log('error=>',er)
      })
  })
}

insertCompanyDataLinkedin = async (uniqueCompany)=>{
    let exists=0;
    let notExists=0;
    let comapanyData = await Promise.all(uniqueCompany.map(async (jobData) => {
        const data = await Company_Data_Model_LinkedIn.findOne({ companyId: jobData.companyId }).then(async(data)=>{
        if(data){
          exists++;
          // company exists
          console.log("company exists");
        //   if(jobData.ambitionBoxData != undefined){
        //     await Company_Data_Model.updateOne({ _id: data._id }, { $set: {ambitionBoxData: ambitionBoxData} }).then(async(companyUpdateRes)=>{
        //       console.log("Company updated");
        //     }).catch(err => console.log("company update error"))
        //   }
        }
        else{
          notExists++;
          //Company not Exists Company
          console.log("company not exists");
          // adding data to company model        
          let companyObj = {
            companyId: jobData.companyId,
            companyName: jobData.companyName,
          }
          let companyModel = new Company_Data_Model_LinkedIn(companyObj);
          await companyModel.save().then((res)=>{console.log("<===company saved===>")}).catch(error => console.log("comapany save error",error))
        }
      })
    }))
    console.log('notExists===>',notExists)
    console.log('exists===>',exists)
    return comapanyData;
  }

insertJobDataLinkedin = async(uniqueJob)=>{
    let ExiststJob =0;
    let NotExistsJob =0;
    let jobDatas = await Promise.all(uniqueJob.map(async (jobData) => {
      await Job_Data_Model_LinkedIn.findOne({jobId:jobData.jobId}).then(async(jobDataInsert)=>{
        if(jobDataInsert){
          ExiststJob++;
          if(jobDataInsert.keyword.includes(jobData.keyword)){console.log('keys already match job==>')}
          else{
            let dataOldKey = jobDataInsert.keyword;
            let updatekey = dataOldKey;
            updatekey.push(jobData.keyword);
            await Job_Data_Model_LinkedIn.updateOne({ _id: jobDataInsert._id }, { $set: {keyword: updatekey} }).then(async(companyUpdateRes)=>{
              console.log("key updated",jobDataInsert.jobId);
            }).catch(err => console.log("key update error"))
          }
        }else{
          NotExistsJob++;
          const data = await Company_Data_Model_LinkedIn.findOne({ companyId: jobData.companyId }).then(async(data)=>{
            let keySearch = [];
            keySearch.push(jobData.keyword);
            let jobSaveObj = {
                jobId: jobData.jobId,
                title: jobData.title,
                link: jobData.link,
                source:jobData.source,
                keyword:jobData.keyword,
                location: jobData.location,
                postedAt: jobData.postedAt,
                context: jobData.context,
                type: jobData.type,
                datePosted: jobData.datePosted,
                description: jobData.description,
                employmentType: jobData.employmentType,
                hiringOrganization: jobData.hiringOrganization,
                identifier: jobData.identifier,
                image: jobData.image,
                industry: jobData.industry,
                jobLocation: jobData.jobLocation,
                skills: jobData.skills,
                validThrough: jobData.validThrough,
                educationRequirements: jobData.educationRequirements,
                titleId: jobData.titleId,
                industryIds: jobData.industryIds,
                easyLink: jobData.easyLink,
                companyRefId: data._id,
            }
            let jobModel = new Job_Data_Model_LinkedIn(jobSaveObj);
            await jobModel.save().then(async (result)=>{console.log('data save job')}).catch(error => console.log("job save error",error))
          }).catch((error)=>{console.log('job error',error)})
        }
      }).catch((error)=>{console.log('outer job error')})
    }))
    console.log('ExiststJob==>',ExiststJob)
    console.log('NotExistsJob==>',NotExistsJob)
    return ExiststJob;
}

function stopTimeInterval(res){
  console.log("Stop function called");
  clearInterval(interval);
  console.log("Stop function End");
  return res.send({success:true,message:"data inserted"});
}

module.exports = {getDataNaukriDotCom,getDataLinkdin};