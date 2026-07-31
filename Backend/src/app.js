const express = require('express');
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)


app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        const error = new Error("Origin is not allowed by CORS.")
        error.status = 403
        callback(error)
    },
    credentials: true
}))

/*require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

/*using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

app.use((req, res) => {
    res.status(404).json({ message: "Route not found." })
})

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }

    if (err.name === "MulterError") {
        return res.status(400).json({ message: err.message })
    }

    if (err.name === "CastError") {
        return res.status(400).json({ message: "Invalid resource id." })
    }

    if (err.name === "ValidationError") {
        return res.status(400).json({ message: err.message })
    }

    if (err.code === 11000) {
        return res.status(409).json({ message: "An account with those details already exists." })
    }

    console.error(err)
    res.status(err.status || 500).json({
        message: err.status ? err.message : "An unexpected server error occurred."
    })
})


module.exports = app
