/* eslint-disable react-refresh/only-export-components */
import { createContext,useState } from "react";


export const InterviewContext = createContext()

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(true)
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])
    const [error, setError] = useState("")

    return (
        <InterviewContext.Provider value={{ loading, setLoading, report, setReport, reports, setReports, error, setError }}>
            {children}
        </InterviewContext.Provider>
    )
}
