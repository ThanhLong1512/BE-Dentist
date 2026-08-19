const express = require("express");
const accountController = require("./../controllers/accountController");
const authMiddleware = require("./../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware.isAuthorized);

router.route("/").get(accountController.getAllAccounts);
router.route("/me").get(accountController.getAccountByUser);
router
  .route("/updateMe")
  .patch(uploadMiddleware.uploadUserPhoto, accountController.updateMyAccount);
router.route("/deleteMe").delete(accountController.deleteMyAccount);

router
  .route("/:id")
  .get(accountController.getAccount)
  .patch(
    rbacMiddleware.isPermission(["admin", "user"]),
    accountController.updateAccount
  )
  .delete(
    rbacMiddleware.isPermission(["admin"]),
    accountController.deleteAccount
  );

module.exports = router;
