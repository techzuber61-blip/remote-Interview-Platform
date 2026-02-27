import express from 'express'
import { ENV } from './lib/env.js'

const app = express()

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(3000, () => {
    console.log(`App listening on port ${ENV.PORT}!`)
})