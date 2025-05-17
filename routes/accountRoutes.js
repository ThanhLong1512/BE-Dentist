const express = require("express");
const accountController = require("./../controllers/accountController");
const authMiddleware = require("./../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware.isAuthorized);

router.route("/").get(accountController.getAllAccounts);

router
  .route("/:id")
  .get(accountController.getAccount)
  .patch(
    rbacMiddleware.isPermission(["user", "admin"]),
    accountController.updateAccount
  );
module.exports = router;
