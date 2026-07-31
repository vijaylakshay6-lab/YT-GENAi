const { DOMMatrix, ImageData, Path2D } = require("@napi-rs/canvas")

// Supply the PDF.js graphics primitives explicitly so PDF extraction does not
// depend on environment-specific automatic polyfills.
Object.assign(globalThis, {
    DOMMatrix: globalThis.DOMMatrix || DOMMatrix,
    ImageData: globalThis.ImageData || ImageData,
    Path2D: globalThis.Path2D || Path2D
})

const { PDFParse } = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

function badRequest(message) {
    const error = new Error(message)
    error.status = 400
    return error
}

async function extractResumeText(file) {
    const parser = new PDFParse({ data: new Uint8Array(file.buffer) })

    try {
        const result = await parser.getText()
        return result.text.trim()
    } finally {
        await parser.destroy()
    }
}

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    const jobDescription = req.body?.jobDescription?.trim()
    const selfDescription = req.body?.selfDescription?.trim() || ""

    if (!jobDescription) {
        throw badRequest("Job description is required.")
    }

    if (!req.file && !selfDescription) {
        throw badRequest("Provide a resume PDF or a self description.")
    }

    let resume = ""

    if (req.file) {
        try {
            resume = await extractResumeText(req.file)
        } catch {
            throw badRequest("The uploaded file is not a readable PDF.")
        }
    }

    if (req.file && !resume) {
        throw badRequest("The uploaded PDF does not contain readable text.")
    }

    const interviewReportByAi = await generateInterviewReport({
        resume,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume,
        selfDescription,
        jobDescription,
        ...interviewReportByAi
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}

/**
 * @description Controller to generate resume PDF from an interview report.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params
    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport
    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    extractResumeText
}
