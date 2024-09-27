const { QueryTypes, DataTypes } = require("sequelize");
const { sequelize, users } = require("../../model");
const crypto = require("crypto");
const sendMail = require("../../services/sendMail");
const generateRandomNumber = () => {
  return Math.floor(1000 + Math.random() * 9000);
};
exports.renderOrganization = (req, res) => {
  const currentOrganizationNumber = req.user[0].currentOrgNumber;
  if (currentOrganizationNumber) {
    res.redirect("/dashboard");
    return;
  }

  res.render("organization");
};
exports.createOrganization = async (req, res, next) => {
  console.log("hello");
  const userId = req.userId;
  const findUser = await users.findByPk(userId);
  const organizationNumber = generateRandomNumber();
  const { organizationName, address, email, phoneNumber } = req.body;
  const { vatno, panno } = req.body || null;
  //create users_org table
  sequelize.query(
    `CREATE TABLE IF NOT EXISTS users_org(id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,userId INT REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,organizationNumber VARCHAR(255))`,
    {
      type: QueryTypes.CREATE,
    }
  );
  //create org table
  await sequelize.query(
    `CREATE TABLE organization_${organizationNumber}(id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255),address VARCHAR(255),email VARCHAR(255) ,phoneNumber INT ,vatno VARCHAR(255),panno VARCHAR(255) )`,
    {
      type: QueryTypes.CREATE,
    }
  );
  //create invitation table
  await sequelize.query(
    `CREATE TABLE invitation_${organizationNumber}(id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,userId INT REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,token VARCHAR(255),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    {
      type: QueryTypes.CREATE,
    }
  );
  //insert into table org
  await sequelize.query(
    `INSERT INTO organization_${organizationNumber}(name,address,email,phoneNumber,vatno,panno) VALUES(?,?,?,?,?,?)`,
    {
      type: QueryTypes.INSERT,
      replacements: [
        organizationName,
        address,
        email,
        phoneNumber,
        vatno,
        panno,
      ],
    }
  );
  sequelize.query(
    `INSERT INTO users_org(userId,organizationNumber) VALUES(?,?)`,
    {
      type: QueryTypes.INSERT,
      replacements: [userId, organizationNumber],
    }
  );
  findUser.currentOrgNumber = organizationNumber;
  await findUser.save();
  req.organizationNumber = organizationNumber;
  next();
};
exports.createQuestionTable = async (req, res, next) => {
  const organizationNumber = req.organizationNumber;
  await sequelize.query(
    `CREATE TABLE question_${organizationNumber}(
      id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255),
      description TEXT,
      userId INT NOT NULL,
      Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    {
      type: QueryTypes.CREATE,
    }
  );
  next();
};
exports.createAnswerTable = async (req, res, next) => {
  const organizationNumber = req.organizationNumber;
  await sequelize.query(
    `CREATE TABLE answer_${organizationNumber}(
      id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
      questionId INT,
      userId INT,
      answer TEXT,
      Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (questionId) REFERENCES question_${organizationNumber}(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    {
      type: QueryTypes.CREATE,
    }
  );

  res.redirect("/dashboard");
};
exports.renderDashboard = (req, res) => {
  res.render("dashboard/index.ejs");
};
exports.renderForumPage = async (req, res) => {
  const organizationNumber = req.user[0].currentOrgNumber;
  const questionsList = await sequelize.query(
    `SELECT question_${organizationNumber}.*, users.userName 
     FROM question_${organizationNumber} 
     JOIN users ON question_${organizationNumber}.userId = users.id`,
    {
      type: QueryTypes.SELECT,
    }
  );

  res.render("dashboard/forum.ejs", { questionsList: questionsList });
};
exports.renderQuestion = (req, res) => {
  res.render("dashboard/question.ejs");
};
exports.createQuestion = async (req, res) => {
  const currentOrgNumber = req.user[0].currentOrgNumber;
  const userId = req.userId;

  const { title, description } = req.body;
  const files = req.files;

  if (!title || !description) {
    return res.status(400).json({
      message: "please provide title and descriptiom",
    });
  }
  const questionCreateResponse = await sequelize.query(
    `INSERT INTO question_${currentOrgNumber} (title,description,userId) VALUES(?,?,?)`,
    {
      type: QueryTypes.INSERT,
      replacements: [title, description, userId],
    }
  );
  for (let i = 0; i < files.length; i++) {
    await sequelize.query(
      `INSERT INTO questionImage_${currentOrgNumber} (questionId,questionImage) VALUES(?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [questionCreateResponse[0], files[i].filename],
      }
    );
  }
  res.redirect("/forum");
};
exports.renderSingleQuestionPage = async (req, res) => {
  const organizationNumber = req.user[0].currentOrgNumber;

  const { id } = req.params;
  const question = await sequelize.query(
    `SELECT * FROM question_${organizationNumber} WHERE id=?`,
    {
      type: QueryTypes.SELECT,
      replacements: [id],
    }
  );
  const questionImage = await sequelize.query(
    `SELECT * FROM questionImage_${organizationNumber} WHERE questionId=?`,
    {
      type: QueryTypes.SELECT,
      replacements: [id],
    }
  );
  const answers = await sequelize.query(
    `SELECT answer_${organizationNumber}.id , answer_${organizationNumber}.*, users.id AS userId, users.userName 
     FROM answer_${organizationNumber} 
     JOIN users ON answer_${organizationNumber}.userId = users.id 
     WHERE questionId=?`,
    {
      type: QueryTypes.SELECT,
      replacements: [id],
    }
  );
  console.log(answers);

  res.render("dashboard/singleQuestionPage", {
    question,
    questionImage,
    answers,
  });
};
exports.createQuestionImage = async (req, res, next) => {
  const organizationNumber = req.organizationNumber;
  await sequelize.query(
    `CREATE TABLE questionImage_${organizationNumber} (
      id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, 
      questionId INT, 
      FOREIGN KEY (questionId) REFERENCES question_${organizationNumber}(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE, 
      questionImage VARCHAR(255),
      Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
      Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    {
      type: QueryTypes.RAW,
    }
  );
  next();
};
exports.handleAnswer = async (req, res) => {
  const organizationNumber = req.user[0].currentOrgNumber;
  const userId = req.userId;
  const { answer, questionId } = req.body;
  console.log("userId,questionId,answer", userId, questionId, answer);
  await sequelize.query(
    `INSERT INTO answer_${organizationNumber} (userId,questionId,answer) VALUES(?,?,?)`,
    {
      type: QueryTypes.INSERT,
      replacements: [userId, questionId, answer],
    }
  );
  res.json({
    message: "successfully posted answer ",
    status: 200,
  });
};
exports.renderMyOrganization = async (req, res) => {
  const userId = req.userId;
  const currentOrganizationNumber = req.user[0].currentOrgNumber;

  const data = await sequelize.query(
    `SELECT organizationNumber FROM users_org WHERE userId=?`,
    {
      type: QueryTypes.SELECT,
      replacements: [userId],
    }
  );
  let orgsData = [];
  for (let i = 0; i < data.length; i++) {
    const [organizationData] = await sequelize.query(
      `SELECT * FROM organization_${data[i].organizationNumber} `
    );
    orgsData.push({
      ...organizationData[0],
      organizationNumber: +data[i].organizationNumber,
    });
  }

  res.render("dashboard/myOrganization", {
    orgsData,
    currentOrganizationNumber,
  });
};
exports.handleOrganizationDelete = async (req, res) => {
  const userId = req.userId;
  const { id: organizationNumber } = req.params;
  const currentOrganizationNumber = req.user[0].currentOrgNumber;
  console.log(
    "organizationNumber is ",
    organizationNumber,
    "currentOrganizationNumber is",
    currentOrganizationNumber
  );
  await sequelize.query(
    `DROP TABLE IF EXISTS organization_${organizationNumber}`,
    {
      type: QueryTypes.DELETE,
    }
  );
  await sequelize.query(`DROP TABLE IF EXISTS forum_${organizationNumber}`, {
    type: QueryTypes.DELETE,
  });
  await sequelize.query(`DROP TABLE IF EXISTS answer_${organizationNumber}`, {
    type: QueryTypes.DELETE,
  });
  await sequelize.query(`DELETE FROM users_org WHERE organizationNumber=?`, {
    type: QueryTypes.DELETE,
    replacements: [organizationNumber],
  });

  if (currentOrganizationNumber === Number(organizationNumber)) {
    const data = await sequelize.query(
      `SELECT organizationNumber FROM users_org WHERE userId=?`,
      {
        type: QueryTypes.SELECT,
        replacements: [userId],
      }
    );
    const totalLength = data.length;
    console.log("data is ", data, "total length is", totalLength);
    const prevOrg = data[totalLength - 1];
    const currentUser = await users.findByPk(userId);
    currentUser.currentOrgNumber = prevOrg.organizationNumber;
    await currentUser.save();
  }
  res.redirect("/myorganization");
};
exports.renderInvitationPage = (req, res) => {
  res.render("dashboard/inviteFriend");
};
function generateToken(length = 32) {
  //if length is notv given then by default length is 32
  return crypto.randomBytes(length).toString("hex");
}

exports.handleInvitation = async (req, res) => {
  const { email } = req.body;
  const currentOrg = req.user[0].currentOrgNumber;
  const senderEmail = req.user[0].email;
  const userId = req.userId;
  const token = generateToken(12);
  //Insert Into Table
  await sequelize.query(
    `INSERT INTO invitation_${currentOrg} (userId,token) VALUES(?,?)`,
    {
      type: QueryTypes.INSERT,
      replacements: [userId, token],
    }
  );
  //send mail
  const options = {
    Email: email,
    senderMail: senderEmail,
    invitationLink: `http://localhost:3000/accept-invitation?org=${currentOrg}&token=${token}`,
  };
  await sendMail(options);
  res.send("invited successfully");
};
exports.handleAcceptInvite = async (req, res) => {
  const { org, token } = req.query;
  const userId = req.userId;
  const [userExist] = await sequelize.query(
    `SELECT * from invitation_${org} WHERE token=?`,
    {
      type: QueryTypes.SELECT,
      replacements: [token],
    }
  );
  if (userExist) {
    const user = await users.findByPk(userId);
    user.currentOrgNumber = org;
    await user.save();
    res.redirect("/dashboard");
  } else {
    res.send("you cannot access the organization");
  }
};
exports.handleDeleteQuestion = async (req, res) => {
  const { id: questionId } = req.params;
  const currentOrgNumber = req.user[0].currentOrgNumber;
  const userId = req.userId;
  const [data] = await sequelize.query(
    `SELECT * FROM question_${currentOrgNumber} WHERE id=?`,
    {
      type: QueryTypes.SELECT,
      replacements: [questionId],
    }
  );
  if (!data) {
    return res.send("please select the question to delete");
  }
  if (data.userId !== userId) {
    return res.send("you are not allowed to perform delete operation on it");
  }
  await sequelize.query(`DELETE FROM question_${currentOrgNumber} WHERE id=?`, {
    type: QueryTypes.DELETE,
    replacements: [questionId],
  });
  res.redirect("/dashboard");
};
exports.handleDeleteAnswer = async (req, res) => {
  const { id: answerId } = req.params;

  const currentOrgNumber = req.user[0].currentOrgNumber;
  const userId = req.userId;
  const [data] = await sequelize.query(
    `SELECT * FROM answer_${currentOrgNumber} WHERE id=?`,
    {
      type: QueryTypes.SELECT,
      replacements: [answerId],
    }
  );
  if (!data) {
    return res.send("please select the answer to delete");
  }
  if (data.userId !== userId) {
    return res.send("you are not allowed to perform delete operation on it");
  }
  await sequelize.query(`DELETE FROM answer_${currentOrgNumber} WHERE id=?`, {
    type: QueryTypes.DELETE,
    replacements: [answerId],
  });
  res.redirect("/dashboard");
};
