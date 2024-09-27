const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("../config/dbConfig");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.DIALECT,
  operatorAliases: false,
  poryt: 3306,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    idle: dbConfig.pool.idle,
    acquire: dbConfig.pool.acquire,
  },
});
//alternative for above code from line no 3 to line no 14
//const sequelize=new Sequelize("mysql://root@localhost:3306/forumManagement")
sequelize
  .authenticate()
  .then(() => {
    console.log("seqelize connected");
  })
  .catch((err) => {
    console.log(err?.message);
  });
const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.users = require("./userModel.js")(sequelize, DataTypes);
db.sequelize.sync({ force: false }).then(() => {
  console.log("yes re-sync done");
});
module.exports = db;
