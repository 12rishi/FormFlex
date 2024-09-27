const {
  renderOrganization,
  createOrganization,
  createForumTable,
  createQuestionTable,
  createAnswerTable,
  renderDashboard,
  renderForumPage,
  renderQuestion,
  createQuestion,
  renderSingleQuestionPage,
  createQuestionImage,
  handleAnswer,
  renderMyOrganization,
  handleOrganizationDelete,
  renderInvitationPage,
  handleInvitation,
  handleAcceptInvite,
  handleDeleteQuestion,
  handleDeleteAnswer,
} = require("../controller/organization/organizationController");
const { handleAuthenticate } = require("../middleware/authenticateMiddleware");
const { multer, storage } = require("../middleware/multerConfig");
const upload = multer({ storage: storage });

const router = require("express").Router();
router
  .route("/organization")
  .get(handleAuthenticate, renderOrganization)
  .post(
    handleAuthenticate,
    createOrganization,
    createQuestionTable,
    createQuestionImage,
    createAnswerTable
  );
router.route("/dashboard").get(handleAuthenticate, renderDashboard);
router.route("/forum").get(handleAuthenticate, renderForumPage);
router
  .route("/question")
  .get(handleAuthenticate, renderQuestion)
  .post(handleAuthenticate, upload.array("questionImage"), createQuestion);
router.route("/question/:id").get(handleAuthenticate, renderSingleQuestionPage);
router
  .route("/deleteQuestion/:id")
  .get(handleAuthenticate, handleDeleteQuestion);
router.route("/answer").post(handleAuthenticate, handleAnswer);
router.route("/myorganization").get(handleAuthenticate, renderMyOrganization);
router.route("/org/:id").get(handleAuthenticate, handleOrganizationDelete);
router
  .route("/invite")
  .get(handleAuthenticate, renderInvitationPage)
  .post(handleAuthenticate, handleInvitation);
router.route("/accept-invitation").get(handleAuthenticate, handleAcceptInvite);
router.route("/answer/:id").get(handleAuthenticate, handleDeleteAnswer);
module.exports = router;
