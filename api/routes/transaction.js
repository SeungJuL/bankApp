const router = require('express').Router()
const authenticateToken = require('../middleware/authenticateToken.js')
const pool = require('../db/db.js')
const ResponseUtil = require('../util/responseUtil.js')

// router.use(authenticateToken)

router.post('/create-account', async (req, res) => {
    try {
        // Create new account
        const result = await pool.query('INSERT INTO bank_accounts (fk_user, balance) VALUES ($1, $2) RETURNING *', [2, 5000])

        if (result.rowCount > 0) {
            res.status(201).json(ResponseUtil.success("Account created successfully", result.rows[0]));
        } else {
            res.status(400).json(ResponseUtil.failure("Account creation failed", null));
        }
    } catch (err) {
        res.status(500).json(ResponseUtil.error(err.message, null));
    }
});

router.get('/check-balance', async (req, res) =>{
    try{
        let accountBalance = await pool.query('SELECT balance FROM bank_accounts WHERE fk_user=$1', [req.user.id])
        if(accountBalance.rowCount > 0) {
            res.status(200).json(ResponseUtil.success("Pulling account balance success", accountBalance.rows[0].balance))
        } else {
            res.status(400).json(ResponseUtil.failure("Pulling account balance failed", null))
        }
    } catch(err) {
        res.status(500).json(ResponseUtil.error(err.message, null))
    }
    
})

router.post('/deposit', async (req, res) => {
    const client = await pool.connect()
    try{
        await client.query('BEGIN')
        let accountBalance = (await client.query('SELECT balance FROM bank_accounts WHERE fk_user=$1 FOR UPDATE', [2])) //lock the balance column
        if(req.body.amount < 0) {
            return res.status(400).json(ResponseUtil.failure("Deposit amount must be greater than 0", null))
        }
        let afterDeposit = Number(req.body.amount) + accountBalance.rows[0].balance
        let depositResult = await client.query('UPDATE bank_accounts SET balance = $1 WHERE fk_user = $2 RETURNING *', [afterDeposit, 2])
        if(depositResult.rowCount > 0) {
            await client.query('COMMIT')
            res.status(200).json(ResponseUtil.success("Deposit success", depositResult.rows[0]))
        } else {
            res.status(400).json(ResponseUtil.failure("Deposit failed", null))
        }
    } catch(err) {
        await client.query('ROLLBACK')
        res.status(500).json(ResponseUtil.error(err.message, null))
    } finally {
        client.release()
    }
})

router.post('/withdrawal', async (req, res) => {
    const client = await pool.connect()
    try{
        await client.query('BEGIN')
        let accountBalance = await client.query('SELECT balance FROM bank_accounts WHERE fk_user=$1 FOR UPDATE', [2])
        if(req.body.amount < 0) {
            return res.status(400).json(ResponseUtil.failure("Withdrawal amount must be greater than 0", null))
        }
        let afterWithdrawal = accountBalance.rows[0].balance - Number(req.body.amount)
        if(afterWithdrawal < 0) {
            return res.status(400).json(ResponseUtil.failure("Withdrawal amount must be smaller than balance", null))
        }
        let withdrawalResult = await client.query('UPDATE bank_accounts SET balance = $1 WHERE fk_user = $2 RETURNING *', [afterWithdrawal, 2])
        if(withdrawalResult.rowCount > 0) {
            await client.query('COMMIT')
            res.status(200).json(ResponseUtil.success("Withdrawal success", withdrawalResult.rows[0]))
        } else {
            res.status(400).json(ResponseUtil.failure("Withdrawal failed", null))
        }
    } catch(err) {
        await client.query('ROLLBACK')
        res.status(500).json(ResponseUtil.error(err.message, null))
    } finally {
        client.release()
    }
})

router.post('/transfer', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const { fromAccountId, toAccountId, amount } = req.body

        if (!fromAccountId || !toAccountId || amount <= 0) {
            return res.status(400).json(ResponseUtil.failure("Invalid transfer parameters", null));
        }

        let fromAccount = await client.query('SELECT balance FROM bank_accounts WHERE fk_user = $1', [fromAccountId]);
        if (fromAccount.rowCount === 0) {
            return res.status(400).json(ResponseUtil.failure("From account not found", null));
        }
        if (fromAccount.rows[0].balance < amount) {
            return res.status(400).json(ResponseUtil.failure("Insufficient funds in from account", null));
        }

        let toAccount = await client.query('SELECT balance FROM bank_accounts WHERE fk_user = $1', [toAccountId]);
        if (toAccount.rowCount === 0) {
            return res.status(404).json(ResponseUtil.failure("To account not found", null));
        }

        await client.query('UPDATE bank_accounts SET balance = balance - $1 WHERE fk_user = $2', [amount, fromAccountId])
        await client.query('UPDATE bank_accounts SET balance = balance + $1 WHERE fk_user = $2', [amount, toAccountId])
        
        await client.query('COMMIT')
        res.status(200).json(ResponseUtil.success("transfer success", null))

    } catch(err) {
        await client.query('ROLLBACK')
        res.status(500).json(ResponseUtil.error(err.message, null))

    } finally {
        client.release()
    }
})


module.exports = router