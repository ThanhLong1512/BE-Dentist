const express = require("express");
const reviewController = require("./../controllers/reviewController");
const authMiddleware = require("./../middlewares/authMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware.isAuthorized);

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    rbacMiddleware.isPermission(["user"]),
    reviewController.setServiceUserIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    rbacMiddleware.isPermission(["user", "admin"]),
    reviewController.updateReview
  )
  .delete(
    rbacMiddleware.isPermission(["user", "admin"]),
    reviewController.deleteReview
  );

module.exports = router;
