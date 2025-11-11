// Supabase Edge Function for AI Chat
// Uses Hugging Face Inference API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  query: string
  weather?: string
  location?: string
  temperature?: number
  rainfall?: number
  humidity?: number
}

// Category mapping
const CATEGORY_LABELS: { [key: string]: string } = {
  "LABEL_0": "Irrigation",
  "LABEL_1": "Pest Control",
  "LABEL_2": "Fertilization",
  "LABEL_3": "Crop Selection",
  "LABEL_4": "Weather Advisory",
  "LABEL_5": "Soil Management",
  "LABEL_6": "Harvesting",
  "LABEL_7": "General Query"
}

const CATEGORY_ICONS: { [key: string]: string } = {
  "Irrigation": "💧",
  "Pest Control": "🐛",
  "Fertilization": "🌱",
  "Crop Selection": "🌾",
  "Weather Advisory": "🌤️",
  "Soil Management": "🌍",
  "Harvesting": "🚜",
  "General Query": "❓"
}

async function classifyQuery(query: string, hfApiKey: string): Promise<{ category: string, confidence: number }> {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/GautamR/agri_bert_classifier",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: query }),
      }
    )

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`)
    }

    const result = await response.json()
    const topResult = result[0][0]
    const category = CATEGORY_LABELS[topResult.label] || "General Query"
    const confidence = topResult.score

    return { category, confidence }
  } catch (error) {
    console.error("Classification error:", error)
    // Fallback classification
    return fallbackClassify(query)
  }
}

function fallbackClassify(query: string): { category: string, confidence: number } {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('water') || lowerQuery.includes('irrigate')) {
    return { category: "Irrigation", confidence: 0.85 }
  } else if (lowerQuery.includes('pest') || lowerQuery.includes('insect')) {
    return { category: "Pest Control", confidence: 0.85 }
  } else if (lowerQuery.includes('fertilizer') || lowerQuery.includes('nutrient')) {
    return { category: "Fertilization", confidence: 0.85 }
  } else if (lowerQuery.includes('crop') || lowerQuery.includes('plant')) {
    return { category: "Crop Selection", confidence: 0.85 }
  } else if (lowerQuery.includes('weather') || lowerQuery.includes('rain')) {
    return { category: "Weather Advisory", confidence: 0.85 }
  } else if (lowerQuery.includes('soil')) {
    return { category: "Soil Management", confidence: 0.85 }
  } else if (lowerQuery.includes('harvest')) {
    return { category: "Harvesting", confidence: 0.85 }
  }
  
  return { category: "General Query", confidence: 0.75 }
}

async function generateAdvice(
  query: string,
  category: string,
  weather: string | undefined,
  temperature: number | undefined,
  rainfall: number | undefined,
  humidity: number | undefined,
  hfApiKey: string
): Promise<string> {
  // Build context
  let weatherContext = ""
  if (weather) weatherContext += `Current weather: ${weather}. `
  if (temperature) weatherContext += `Temperature: ${temperature}°C. `
  if (rainfall) weatherContext += `Expected rainfall: ${rainfall}mm. `
  if (humidity) weatherContext += `Humidity: ${humidity}%. `

  const prompt = `You are an expert agricultural advisor. Based on the following information, provide specific, actionable farming advice.

Category: ${category}
Farmer's Question: ${query}
${weatherContext}

Provide a clear, concise recommendation (2-3 sentences):`

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/pjh11098/Weather_Forecast-Based_Personalized_Recommendation_System_with_Gemma_Model",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true
          }
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`)
    }

    const result = await response.json()
    let advice = result[0].generated_text
    
    // Extract only the generated part
    if (advice.includes("Provide a clear, concise recommendation")) {
      advice = advice.split("Provide a clear, concise recommendation")[1]
      if (advice.startsWith(":")) advice = advice.substring(1)
    }
    
    return advice.trim()
  } catch (error) {
    console.error("Generation error:", error)
    return generateFallbackAdvice(category, temperature, rainfall, humidity)
  }
}

function generateFallbackAdvice(
  category: string,
  temperature: number | undefined,
  rainfall: number | undefined,
  humidity: number | undefined
): string {
  const adviceMap: { [key: string]: string } = {
    "Irrigation": rainfall && rainfall > 5 
      ? "Rain is expected soon. Avoid irrigation today. Monitor soil moisture levels regularly."
      : "Soil moisture is low. Irrigate your field within 24 hours. Use drip irrigation for efficiency.",
    
    "Pest Control": humidity && humidity > 70
      ? `High humidity (${humidity}%) increases pest risk. Inspect crops daily and apply organic neem spray if needed.`
      : "Current conditions are moderate for pests. Inspect crops daily and maintain field hygiene.",
    
    "Fertilization": rainfall && rainfall > 2
      ? "Rainfall expected - good time for fertilizer application. Use balanced NPK based on soil test results."
      : "Apply fertilizer in the evening to avoid nutrient loss. Water the field after application.",
    
    "Crop Selection": temperature && temperature > 25
      ? `Current temperature (${temperature}°C) is suitable for warm-season crops like rice, maize, and cotton.`
      : "Consider cool-season crops for current conditions. Check local agricultural guidelines.",
    
    "Weather Advisory": rainfall && rainfall > 20
      ? "Heavy rainfall expected - prepare drainage systems. Protect crops from waterlogging."
      : "Weather conditions are favorable for farming activities. Monitor forecasts daily.",
    
    "Soil Management": "Test soil pH and nutrient levels. Add organic matter to improve soil structure. Practice crop rotation.",
    
    "Harvesting": rainfall && rainfall > 5
      ? "Wait for dry weather before harvesting. Ensure proper storage facilities are ready."
      : "Weather conditions are suitable for harvesting. Plan accordingly.",
    
    "General Query": "For specific agricultural advice, please provide more details about your crop, location, and farming practices."
  }

  return adviceMap[category] || adviceMap["General Query"]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, weather, location, temperature, rainfall, humidity }: ChatRequest = await req.json()

    // Get Hugging Face API key from environment
    const hfApiKey = Deno.env.get('HUGGINGFACE_API_KEY')
    if (!hfApiKey) {
      throw new Error('HUGGINGFACE_API_KEY not configured')
    }

    console.log(`Processing query: ${query}`)

    // Step 1: Classify query
    const { category, confidence } = await classifyQuery(query, hfApiKey)
    console.log(`Classification: ${category} (${confidence})`)

    // Step 2: Generate advice
    const advice = await generateAdvice(
      query,
      category,
      weather,
      temperature,
      rainfall,
      humidity,
      hfApiKey
    )

    // Step 3: Cache response in Supabase (optional)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    await supabase.from('ai_chat_cache').insert({
      query,
      category,
      confidence,
      advice,
      weather_context: weather,
      temperature,
      rainfall,
      humidity,
      location
    }).catch(err => console.error('Cache error:', err))

    // Return response
    const response = {
      category,
      confidence: Math.round(confidence * 100) / 100,
      advice,
      weather_context: weather,
      icon: CATEGORY_ICONS[category] || "💬"
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
