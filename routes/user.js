var express = require('express');
var router = express.Router();
const cel = require('connect-ensure-login');

router.get('/logout', (req, res) => {
	res.render("index")
});
router.get('/settings', (req, res) => {
	res.render("index")
});
module.exports = router;
