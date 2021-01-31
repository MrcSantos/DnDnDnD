var express = require('express');
var router = express.Router();
const cel = require('connect-ensure-login');

router.get('/logout', (req, res) => {
	res.render("wip")
});
router.get('/settings', (req, res) => {
	res.render("wip")
});
module.exports = router;
