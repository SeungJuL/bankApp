const jwt = require('jsonwebtoken')
const responseUtil = require('../util/responseUtil.js')

function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]
    if(!token) {
        return res.redirect('/user/login')
    }

    jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(400).json(responseUtil(err.message, null))
        }
        req.user = user
        next()
    });
} 

module.exports = authenticateToken