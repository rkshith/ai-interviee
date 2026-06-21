const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const AI_PROVIDER = (process.env.AI_PROVIDER || (process.env.OPENROUTER_API_KEY ? "openrouter" : "google")).toLowerCase()
const GOOGLE_MODEL = process.env.GOOGLE_MODEL || "gemini-3-flash-preview"
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

const googleAi = process.env.GOOGLE_GENAI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })
    : null


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

function ensureAiProvider() {
    if (AI_PROVIDER === "google" && !googleAi) {
        throw new Error("GOOGLE_GENAI_API_KEY is required when AI_PROVIDER=google")
    }

    if (AI_PROVIDER === "openrouter" && !process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter")
    }
}

async function generateJsonWithGoogle({ prompt, responseSchema, model }) {
    const response = await googleAi.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(responseSchema),
        }
    })

    return JSON.parse(response.text)
}

async function generateJsonWithOpenRouter({ systemPrompt, userPrompt, model }) {
    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
            "X-Title": process.env.OPENROUTER_APP_NAME || "interview-ai-yt"
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter request failed with ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("OpenRouter returned an empty response")
    }

    return JSON.parse(content)
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    ensureAiProvider()

    const userPrompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Return only valid JSON matching this shape:
{
  "matchScore": number,
  "technicalQuestions": [{ "question": string, "intention": string, "answer": string }],
  "behavioralQuestions": [{ "question": string, "intention": string, "answer": string }],
  "skillGaps": [{ "skill": string, "severity": "low" | "medium" | "high" }],
  "preparationPlan": [{ "day": number, "focus": string, "tasks": [string] }],
  "title": string
}`

    if (AI_PROVIDER === "openrouter") {
        return generateJsonWithOpenRouter({
            systemPrompt: "You generate strict JSON only. Do not include markdown or extra text.",
            userPrompt,
            model: OPENROUTER_MODEL
        })
    }

    return generateJsonWithGoogle({
        prompt: userPrompt,
        responseSchema: interviewReportSchema,
        model: GOOGLE_MODEL
    })


}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    ensureAiProvider()

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const userPrompt = `Generate a resume for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Return only valid JSON with a single field named "html" that contains the resume HTML.
The HTML should be simple, professional, ATS-friendly, and fit in 1-2 pages when converted to PDF.`

    const jsonContent = AI_PROVIDER === "openrouter"
        ? await generateJsonWithOpenRouter({
            systemPrompt: "You generate strict JSON only. Do not include markdown or extra text.",
            userPrompt,
            model: OPENROUTER_MODEL
        })
        : await generateJsonWithGoogle({
            prompt: userPrompt,
            responseSchema: resumePdfSchema,
            model: GOOGLE_MODEL
        })

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }