const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");


exports.protect = asyncHandler(async(req, _, next) => {
  try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
      
    //   console.log(token);
      if (!token) {
          throw new ApiError(401, "Unauthorized request")
      }
  
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      console.log(decodedToken)
  
      const user = await User.findOne({_id : decodedToken?._id}).select("-password -refreshToken")
  
      if (!user) {
          
          throw new ApiError(401, "Invalid Access Token")
      }
  
      req.user = user;
      next()
  } catch (error) {
      throw new ApiError(401, error?.message || "Invalid access token")
  }
});