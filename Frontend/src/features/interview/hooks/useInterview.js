/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect } from "react"
import { useParams } from "react-router"
import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { InterviewContext } from "../interview.context"

function getErrorMessage(error) {
    return error.response?.data?.message || "Something went wrong. Please try again."
}

export const useInterview = () => {
    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports, error, setError } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError("")

        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (requestError) {
            setError(getErrorMessage(requestError))
            throw requestError
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (id) => {
        setLoading(true)
        setError("")
        setReport(null)

        try {
            const response = await getInterviewReportById(id)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (requestError) {
            setError(getErrorMessage(requestError))
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        setError("")

        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (requestError) {
            setError(getErrorMessage(requestError))
            return []
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        setError("")

        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.download = `resume_${interviewReportId}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (requestError) {
            setError(getErrorMessage(requestError))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, error, generateReport, getReportById, getReports, getResumePdf }
}
