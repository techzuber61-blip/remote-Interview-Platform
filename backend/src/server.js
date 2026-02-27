import express from 'express'
import { ENV } from './lib/env.js'
import path from "path"
import { connectDB } from './lib/db.js'

const app = express()

const __dirname = path.resolve()

app.get('/', (req, res) => {
    res.send('Hello World!')
})

if (ENV.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')))
    app.get('/{*any}', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'))
    })
}

const startServer = async () => {
    try {
        await connectDB();
        app.listen(ENV.PORT, () => console.log(`App listening on port ${ENV.PORT}!`))
    } catch (error) {
        console.log("Error starting the server",error);
    }
}

startServer();