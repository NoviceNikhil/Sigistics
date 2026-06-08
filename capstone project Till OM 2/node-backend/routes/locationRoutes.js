const express = require("express");
const locationController = require("../controllers/AdminLocationController");
const authenticate = require("../middleware/authenticate_middlewere")
const roleVerifyMiddlewere = require("../middleware/roleVerifyMiddlewere")
const router = express.Router();

router.get("/public", locationController.getAllLocations);

router
  .route("/")
  .get(authenticate, roleVerifyMiddlewere("admin"), locationController.getAllLocations)
  .post(authenticate, roleVerifyMiddlewere("admin"), locationController.createLocation);

router
  .route("/:id")
  .get(authenticate, roleVerifyMiddlewere("admin"), locationController.getLocationById)
  .delete(authenticate, roleVerifyMiddlewere("admin"), locationController.deleteLocation);
router.patch("/:id/restore", authenticate, roleVerifyMiddlewere("admin"), locationController.restoreLocation);
module.exports = router;