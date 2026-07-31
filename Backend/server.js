require("dotenv").config()
const app = require("./src/app")
const connectDB = require("./src/config/db")

const port = Number(process.env.PORT) || 3000

async function startServer() {
    await connectDB()

    app.listen(port, () => {
        console.log(`Server is ready on PORT ${port}`)
    })
}

startServer().catch(() => {
    process.exitCode = 1
})
