var express = require('express');
var router = express.Router();
const cel = require('connect-ensure-login');

/* GET home page. */
router.get('/', (req, res) => {
	res.render("characters/SPECIALCalculator")
});

router.get('/translator', (req, res) => {
	res.render("characters/translator")
});

module.exports = router;
