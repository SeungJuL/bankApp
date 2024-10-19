const express = require('express')
require('dotenv').config()

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))



app.get("/", (req, res) => {
    res.send("welcome to the bank app")
})

app.use('/user', require('./routes/user.js'))
app.use('/transaction', require('./routes/transaction.js'))

app.listen(process.env.PORT, () => {
    console.log(`Server is running at http://localhost:` + process.env.PORT);
})