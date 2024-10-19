const router = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const pool = require('../db/db.js')
const ResponseUtil = require('../util/responseUtil.js')

router.post('/login', async (req, res) => {
    try{
        let userResult = await pool.query('SELECT * FROM users WHERE username = $1', [req.body.username])
        if (userResult.rowCount === 0) {
            return res.status(400).json(ResponseUtil.failure("User not found", null))
        }
        if(await bcrypt.compare(req.body.password, userResult.rows[0].password)) {
            const token = jwt.sign({id: userResult.rows[0].id, username: userResult.rows[0].username}, process.env.TOKEN_SECRET_KEY, {expiresIn: '1h'})
            console.log(token)
            res.status(200).json(ResponseUtil.success("Login successful", token))
        } else {
            res.status(400).json(ResponseUtil.failure("password not matched", null))
        }
    } catch(err) {
        res.status(500).json(ResponseUtil.error(err.message, null))
    }
})

router.post('/register', async (req, res) => {
    try {
        let userResult = await pool.query('SELECT * FROM users WHERE username = $1', [req.body.username])
        if (userResult.rowCount > 0) {
            res.status(400).json(ResponseUtil.failure("Duplicated username found. Please use other username", null))
        } else {
            let hash = await bcrypt.hash(req.body.password, 10)
            userResult = await pool.query('INSERT INTO users(username, password) VALUES($1, $2) RETURNING *', [req.body.username, hash])
            res.status(200).json(ResponseUtil.success("Regitser success", userResult.rows[0]))
        }
    } catch (err) {
        res.status(500).json(ResponseUtil.error(err.message, null))
    }
})


module.exports = router