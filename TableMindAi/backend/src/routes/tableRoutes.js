const express = require("express");

const tableController = require("../controllers/tableController");

const router = express.Router();

router.post("/validate", tableController.validateTableNumber);
router.post("/session", tableController.createTableSession);
router.get("/config", tableController.getTableConfig);

module.exports = router;
