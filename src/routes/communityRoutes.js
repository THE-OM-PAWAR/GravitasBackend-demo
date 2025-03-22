const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createCommunity,
  getAllCommunities,
  myCommunities,
} = require("../controllers/communityController");
const { upload } = require("../middleware/multer.middleware");

const router = express.Router();

router.post(
  "/create",
  protect,
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  createCommunity
);

router.get("/all", getAllCommunities);
router.get("/my-communities", protect, myCommunities);
// router.post('/login', authController.login);                                                             
// router.post('/verify-otp', authController.verifyOTP);
// router.post('/resend-otp', authController.resendOTP);
// router.post('/login-with-otp', authController.loginWithOTP);
// router.post('/verify-login-otp', authController.verifyLoginOTP);

module.exports = router;
