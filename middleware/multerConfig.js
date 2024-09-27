const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const allowFiles = ["image/jpg", "image/jpeg", "image/png"];
    if (!allowFiles.includes(file.mimetype)) {
      cb(new Error("only jpg,jpeg or png file type is supported"));
      return;
    }
    cb(null, "./storage/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
module.exports = {
  multer,
  storage,
};
