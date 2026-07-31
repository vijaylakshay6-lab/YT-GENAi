const multer = require("multer")


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype !== "application/pdf") {
            return callback(new Error("Only PDF resumes are supported."))
        }

        callback(null, true)
    }
})


module.exports = upload
