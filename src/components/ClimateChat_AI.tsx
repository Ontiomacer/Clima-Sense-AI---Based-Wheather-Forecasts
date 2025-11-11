import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, Sparkles, Brain, Leaf } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  category?: string;
  confidence?: number;
  icon?: string;
  weatherData?: any;
}

const ClimateChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI-powered Agricultural & Climate Advisor. I can help you with:\n\n🌾 **Farming Advice**\n• Irrigation planning\n• Pest control\n• Fertilization guidance\n• Crop selection\n• Soil management\n\n🌤️ **Weather Insights**\n• Real-time forecasts\n• Climate predictions\n• Weather-based recommendations\n\n**Try asking:**\n• Should I irrigate my field tomorrow?\n• What's the weather in Punjab?\n• How to control pests in rice crops?\n• Best time to apply fertilizer?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'weather' | 'farming'>('farming');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const detectQueryType = (query: string): 'weather' | 'farming' => {
    const weatherKeywords = ['weather', 'temperature', 'rain', 'forecast', 'climate', 'hot', 'cold'];
    const farmingKeywords = ['irrigate', 'pest', 'fertilizer', 'crop', 'soil', 'harvest', 'plant', 'seed'];
    
    const lowerQuery = query.toLowerCase();
    const hasWeather = weatherKeywords.some(word => lowerQuery.includes(word));
    const hasFarming = farmingKeywords.some(word => lowerQuery.includes(word));
    
    if (hasFarming && !hasWeather) return 'farming';
    if (hasWeather && !hasFarming) return 'weather';
    return 'farming'; // Default to farming for mixed queries
  };

  const fetchWeatherData = async (location: string) => {
    try {
      const aiServerUrl = import.meta.env.VITE_AI_FORECAST_URL || 'http://localhost:3002';
      const response = await fetch(`${aiServerUrl}/api/ai-forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: 20.5937,
          lon: 78.9629,
          location: location,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Weather fetch error:', error);
      return null;
    }
  };

  const callAIBackend = async (query: string, weatherData: any) => {
    try {
      const aiBackendUrl = 'http://localhost:8000';
      const response = await fetch(`${aiBackendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          weather: weatherData?.current?.description || null,
          temperature: weatherData?.current?.temperature || null,
          rainfall: weatherData?.forecast?.monthly?.[0]?.rainfall?.predicted || null,
          humidity: weatherData?.current?.humidity || null,
          location: weatherData?.location?.name || 'India',
        }),
      });

      if (!response.ok) {
        throw new Error('AI Backend not available');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Backend error:', error);
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = input;
    setInput('');
    setLoading(true);

    try {
      // Detect query type
      const queryType = detectQueryType(currentQuery);
      setAiMode(queryType);

      // Fetch weather data if needed
      let weatherData = null;
      if (queryType === 'weather' || currentQuery.toLowerCase().includes('weather')) {
        weatherData = await fetchWeatherData('India');
      }

      // Call AI backend for farming advice
      const aiResponse = await callAIBackend(currentQuery, weatherData);

      let assistantContent = '';
      let category = '';
      let confidence = 0;
      let icon = '🤖';

      if (aiResponse && aiResponse.advice) {
        // AI-generated response
        assistantContent = `**${aiResponse.icon} ${aiResponse.category}** (Confidence: ${(aiResponse.confidence * 100).toFixed(0)}%)\n\n${aiResponse.advice}`;
        category = aiResponse.category;
        confidence = aiResponse.confidence;
        icon = aiResponse.icon;

        if (weatherData && weatherData.current) {
          assistantContent += `\n\n📊 **Current Conditions:**\n• Temperature: ${weatherData.current.temperature}°C\n• Humidity: ${weatherData.current.humidity}%\n• Conditions: ${weatherData.current.description}`;
        }
      } else {
        // Fallback response
        assistantContent = "I'm here to help with agricultural and climate advice. Could you please rephrase your question or ask about:\n• Irrigation planning\n• Pest control\n• Weather forecasts\n• Crop management\n• Fertilization guidance";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        category: category,
        confidence: confidence,
        icon: icon,
        weatherData: weatherData,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error processing your request. Please make sure the AI backend is running (http://localhost:8000) and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "Should I irrigate my field today?",
    "How to control pests in crops?",
    "Weather forecast for Punjab",
    "Best time to apply fertilizer?",
    "What crops to plant now?",
    "Soil management tips",
  ];

  const categoryIcons: { [key: string]: string } = {
    'Irrigation': '💧',
    'Pest Control': '🐛',
    'Fertilization': '🌱',
    'Crop Selection': '🌾',
    'Weather Advisory': '🌤️',
    'Soil Management': '🌍',
    'Harvesting': '🚜',
  };

  return (
    <section className="py-20 px-4 min-h-screen">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-primary animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-bold">AI Agricultural Advisor</h2>
          </div>
          <p className="text-lg text-muted-foreground">
            Powered by AgriBERT + GraphCast AI Models
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Leaf className="w-3 h-3" />
              Farming Intelligence
            </Badge>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              AI Climate & Farming Assistant
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                AgriBERT + GraphCast + Weather Data
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Chat Messages */}
            <ScrollArea className="h-[500px] p-6" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.category && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                          <span className="text-lg">{message.icon}</span>
                          <Badge variant="outline" className="text-xs">
                            {message.category}
                          </Badge>
                          {message.confidence && (
                            <span className="text-xs text-muted-foreground">
                              {(message.confidence * 100).toFixed(0)}% confidence
                            </span>
                          )}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div className="text-xs opacity-60 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-6 pb-4">
                <p className="text-sm text-muted-foreground mb-2">Quick questions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(question);
                        setTimeout(() => handleSend(), 100);
                      }}
                      className="text-xs justify-start"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about farming, weather, or climate..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 AI-powered advice • 🌾 Farming intelligence • 🌤️ Weather integration
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">AgriBERT Classifier</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically categorizes your farming queries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">GraphCast AI Model</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Generates advanced weather forecasts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Weather Integration</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Combines AI with real-time weather data
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ClimateChat;
