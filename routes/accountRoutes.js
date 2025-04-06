const express = require("express");
const accountController = require("./../controllers/accountController");

const Router = express.Router();

Router.get("/", accountController.getAccounts);
Router.put("/:id", accountController.updateAccount);
// Router.get("/accounts", accountController.getAccounts);

module.exports = Router;
