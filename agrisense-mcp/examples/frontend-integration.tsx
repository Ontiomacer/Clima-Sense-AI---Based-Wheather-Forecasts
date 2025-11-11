// Example: Integrate AgriSense MCP into your React frontend

import { useState } from 'react';

interface AgriSenseRequest {
  crop: string;
  location: string;
  soil_moisture: number;
  temperature: number;
  rainfall_mm: number;
  ndvi?: number;
}

interface AgriSenseResponse {
  crop_health: string;
  risk_score: number;
  suggestions: string[];
  confidence: string;
  ai_source: string;
  metadata: {
    timestamp: string;
    location: string;
    crop: string;
    processing_time_ms: number;
  };
}

export const useAgriSense = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (data: AgriSenseRequest): Promise<AgriSenseResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:9090/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`AgriSense API error: ${response.status}`);
      }

      const result: AgriSenseResponse = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('AgriSense analysis failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error };
};

// Example Component
export const AgriSenseAnalyzer = () => {
  const { analyze, loading, error } = useAgriSense();
  const [result, setResult] = useState<AgriSenseResponse | null>(null);

  const handleAnalyze = async () => {
    const data: AgriSenseRequest = {
      crop: 'wheat',
      location: 'Pune,IN',
      soil_moisture: 0.34,
      temperature: 29.5,
      rainfall_mm: 12.7,
      ndvi: 0.56,
    };

    const response = await analyze(data);
    if (response) {
      setResult(response);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">AgriSense Analysis</h2>
      
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze Crop'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded">
              <h3 className="font-semibold text-green-800">Crop Health</h3>
              <p className="text-2xl font-bold text-green-600">{result.crop_health}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded">
              <h3 className="font-semibold text-orange-800">Risk Score</h3>
              <p className="text-2xl font-bold text-orange-600">
                {(result.risk_score * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">AI Suggestions</h3>
            <ul className="space-y-2">
              {result.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-sm text-gray-600">
            <p>Confidence: {result.confidence}</p>
            <p>Processing Time: {result.metadata.processing_time_ms}ms</p>
            <p className="text-xs mt-1">{result.ai_source}</p>
          </div>
        </div>
      )}
    </div>
  );
};
