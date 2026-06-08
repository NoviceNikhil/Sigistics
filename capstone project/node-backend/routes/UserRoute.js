const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../middleware/authenticate_middlewere");
const roleVerifyMiddlewere = require("../middleware/roleVerifyMiddlewere");


// ------------------------------------------------------------------------------

router.patch("/profile", authenticate, userController.patchCurrentUser);
router.delete("/profile", authenticate, userController.deleteCurrentUser);
router.get("/", authenticate, roleVerifyMiddlewere("user"), userController.getAllUsers);
router.get("/:id", authenticate, userController.getUserById);
router.post("/", userController.createNewUser);
router.patch("/:id", userController.patchUser);
router.delete("/:id", userController.deleteUser);

// ------------------------------------------------------------------------------




module.exports = router;
