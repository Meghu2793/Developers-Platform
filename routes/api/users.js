const express = require("express");
const router = express.Router();

// @route GET api/users/test
// @desc Tests User route
// @access public
router.get("/test", (req, res) => {
  res.json({ msg: "Users Works" });
});

module.exports = router;
