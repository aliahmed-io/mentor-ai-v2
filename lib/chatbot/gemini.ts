// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.GEMINI_API_KEY
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(API_KEY!)

export async function generateFromGemini(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not set')
  }

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    // Generate content
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    if (!text) {
      throw new Error('No text content in response')
    }

    return text
  } catch (error: any) {
    console.error('Gemini API error:', error)
    
    // Handle specific error cases
    if (error.message?.includes('404')) {
      throw new Error('Gemini model not found. Please check your model name and API key.')
    }
    
    if (error.message?.includes('403')) {
      throw new Error('Invalid API key. Please check your GEMINI_API_KEY.')
    }
    
    throw new Error(`Failed to generate response: ${error.message}`)
  }
}