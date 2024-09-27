const { decodeToken } = require("../services/decodeToken");
const { users } = require("../model");
exports.handleAuthenticate = async (req, res, next) => {
  const token = req.cookies.token;
  console.log("token", token);
  if (!token) {
    return res.redirect("/");
  }
  const verifyToken = await decodeToken(token, process.env.SECRET_KEY);
  if (!verifyToken) {
    return res.send("invalid token");
  }
  const findUser = await users.findAll({
    where: {
      id: verifyToken.id,
    },
  });

  if (findUser.length === 0) {
    res.send("no user has been found for that id");
  } else {
    req.user = findUser;
    req.userId = findUser[0].id;
  }
  next();
};
