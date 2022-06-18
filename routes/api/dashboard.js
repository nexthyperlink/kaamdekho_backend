const express = require("express");

const router = express.Router();

const DashboardController = require("../controllers/dashboardControllers");

router.post("/dashboard",DashboardController.getDashboardData);
router.post("/getTop100Company",DashboardController.getTop100Company);
router.get("/list",DashboardController.getAllData);
router.get("/keywordAndCountJobs",DashboardController.keywordAndCountJobs);
router.get("/search/searchByCompanyName/:companyName",DashboardController.searchByCompanyName);
router.get("/search/searchByCity/:cityName",DashboardController.searchByCityName);
router.get("/search/searchByKeyword/:searchByKeyword",DashboardController.searchByKeyword);

module.exports = router;
// module.exports = {router};