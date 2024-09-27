const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
require("dotenv").config();
require("./model/index");
app.set("view engine", "ejs");

const passport = require("passport");
const { users } = require("./model/index");
const generateToken = require("./services/generateToken");
const organizationRoute = require("./routes/organizationRoute");
//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public/")); //aba file lai link garda public/+ aru public folder vitra ko file link hunxa
app.use(express.static("storage/"));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

//serialization and deserialization
passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

//login start here
var userProfile;
var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID, // Correct key is clientID, not clientId
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      console.log("accessToken", accessToken);
      console.log(profile);
      userProfile = profile;
      return done(null, userProfile);
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});
app.use("/", organizationRoute);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000" }),
  async function (req, res) {
    try {
      const userGmail = userProfile.emails[0].value;
      const user = await users.findOne({
        where: {
          email: userGmail,
        },
      });
      if (user) {
        const token = generateToken(user);
        res.cookie("token", token);
        res.redirect("/organization");
      } else {
        const user = await users.create({
          userName: userProfile.displayName,
          googleId: userProfile.id,
          email: userGmail,
        });
        const token = generateToken(user);
        console.log("token is", token);
        res.cookie(token);
        res.redirect("/organization");
      }
    } catch (error) {
      console.log(error?.message);
    }
  }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server has started at port number ${PORT}`);
});
