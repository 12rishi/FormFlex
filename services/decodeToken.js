const { promisify } = require("util");
const jwt = require("jsonwebtoken");
exports.decodeToken = async (token, key) => {
  const verifyToken = await promisify(jwt.verify)(token, key);
  return verifyToken;
};
