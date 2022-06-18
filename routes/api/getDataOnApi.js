const express = require("express");
const router = express.Router();

const GetApiDataControllers = require("../controllers/getDataOnApiController");

// setCronJob = async (req,res) =>{
    
//     const d = new Date();
//     console.log('Midnight Cron Start:');
//     GetApiDataControllers.getDataNaukriDotCom();
//     // console.log('jaydeep Patil')
// }
// module.exports = {router,setCronJob};

router.post("/getDataNaukriDotCom",GetApiDataControllers.getDataNaukriDotCom);
// router.post("/getDataLinkdin",GetApiDataControllers.getDataLinkdin);
module.exports = router;
