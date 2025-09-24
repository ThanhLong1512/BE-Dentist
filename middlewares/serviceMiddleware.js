const multer = require("multer");
const path = require("path");

exports.populateReviews = function(next) {
  this.populate({ path: "reviews" });
  next();
};
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

exports.uploadServicePhoto = upload.single("photoService");
