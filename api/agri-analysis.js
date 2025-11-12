// Vercel Serverless Function for Agricultural Analysis
// Lightweight version using keyword-based classification

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { text, context } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    // Keyword-based classification (fast, works within timeout)
    const { category, confidence } = classifyText(text);
    const recommendations = generateRecommendations(category, context);

    res.status(200).json({
      success: true,
      model: "Keyword Classifier",
      analysis: {
        category,
        confidence,
        recommendations
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in /api/agri-analysis:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

function classifyText(text) {
  const textLower = text.toLowerCase();
  
  // Keyword-based classification
  if (textLower.match(/dry|drought|water shortage|arid|no rain/)) {
    return { category: "Drought Stress", confidence: 0.85 };
  } else if (textLower.match(/pest|insect|bug|infestation|worm|caterpillar/)) {
    return { category: "Pest Infestation", confidence: 0.85 };
  } else if (textLower.match(/nutrient|deficiency|yellow|pale|nitrogen|phosphorus/)) {
    return { category: "Nutrient Deficiency", confidence: 0.85 };
  } else if (textLower.match(/waterlog|flood|excess water|standing water|too much rain/)) {
    return { category: "Waterlogging", confidence: 0.85 };
  } else if (textLower.match(/disease|fungus|blight|rot|mold|infection/)) {
    return { category: "Disease Risk", confidence: 0.85 };
  } else if (textLower.match(/hot|heat|high temperature|scorching|burning/)) {
    return { category: "Heat Stress", confidence: 0.85 };
  } else if (textLower.match(/cold|frost|freeze|low temperature|winter/)) {
    return { category: "Cold Stress", confidence: 0.85 };
  } else if (textLower.match(/good|optimal|healthy|normal|fine|well/)) {
    return { category: "Optimal Conditions", confidence: 0.80 };
  } else {
    return { category: "Optimal Conditions", confidence: 0.70 };
  }
}

function generateRecommendations(category, context) {
  const recommendationsMap = {
    "Drought Stress": [
      "Implement drip irrigation to maximize water efficiency",
      "Apply mulch to retain soil moisture and reduce evaporation",
      "Consider drought-resistant crop varieties for future planting",
      "Schedule irrigation during early morning or late evening",
      "Monitor soil moisture levels regularly"
    ],
    "Pest Infestation": [
      "Inspect crops regularly for early pest detection",
      "Apply neem-based organic pesticides as first-line treatment",
      "Introduce beneficial insects like ladybugs",
      "Remove and destroy heavily infested plants",
      "Practice crop rotation to break pest life cycles"
    ],
    "Nutrient Deficiency": [
      "Conduct soil testing to identify specific deficiencies",
      "Apply balanced NPK fertilizers based on soil test results",
      "Add organic compost to improve soil structure",
      "Consider foliar feeding for quick nutrient uptake",
      "Monitor plant symptoms and adjust fertilization"
    ],
    "Optimal Conditions": [
      "Maintain current farming practices",
      "Continue regular monitoring of crop health",
      "Plan for upcoming planting or harvesting activities",
      "Consider expanding cultivation if resources permit",
      "Document successful practices for future reference"
    ],
    "Waterlogging": [
      "Improve field drainage by creating channels",
      "Avoid irrigation until soil moisture normalizes",
      "Apply gypsum to improve soil structure",
      "Consider raised bed cultivation",
      "Monitor for fungal diseases"
    ],
    "Disease Risk": [
      "Remove infected plant material immediately",
      "Apply appropriate fungicides or bactericides",
      "Improve air circulation by proper plant spacing",
      "Avoid overhead irrigation",
      "Practice crop rotation with non-susceptible crops"
    ],
    "Heat Stress": [
      "Increase irrigation frequency during hot periods",
      "Apply shade nets for sensitive crops",
      "Mulch heavily to keep soil temperatures down",
      "Schedule field activities during cooler parts of day",
      "Consider heat-tolerant varieties"
    ],
    "Cold Stress": [
      "Use row covers or plastic tunnels for protection",
      "Apply irrigation before expected frost",
      "Avoid pruning or fertilizing before cold periods",
      "Harvest mature crops before severe cold",
      "Consider cold-hardy varieties for winter"
    ]
  };
  
  let recommendations = recommendationsMap[category] || [
    "Monitor crop conditions regularly",
    "Consult with local agricultural extension services",
    "Keep detailed records of observations"
  ];
  
  // Add context-specific recommendations
  if (context) {
    if (context.region && context.region.includes("Maharashtra")) {
      recommendations.push("Consult Maharashtra Agricultural Department for region-specific guidance");
    }
    if (context.crop) {
      recommendations.push(`Review best practices specific to ${context.crop} cultivation`);
    }
  }
  
  return recommendations;
}
