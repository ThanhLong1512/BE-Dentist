const express = require("express");
const accountController = require("./../controllers/accountController");
const authMiddleware = require("./../middlewares/authMiddleware");

const Router = express.Router();
Router.use(authMiddleware.isAuthorized);
Router.get("/", accountController.getAccounts);
Router.put("/:id", accountController.updateAccount);
// Router.get("/accounts", accountController.getAccounts);

module.exports = Router;
