import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, MapPin, Thermometer, CloudRain, Wind } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/i18n/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

const ClimateChat = () => {
  const { t, language } = useLanguage();
  
  const getWelcomeMessage = () => {
    if (language === 'hi') {
      return "नमस्ते! मैं आपका एआई-संचालित जलवायु और कृषि सलाहकार हूं। मैं इसमें मदद कर सकता हूं:\n\n🌤️ **मौसम पूर्वानुमान**\n• भारतीय राज्यों के लिए रीयल-टाइम पूर्वानुमान\n• तापमान, वर्षा, आर्द्रता डेटा\n\n🌾 **खेती सलाह**\n• फसल/मिट्टी की स्थिति का विश्लेषण\n• एआई सिफारिशें प्राप्त करें\n• कीट नियंत्रण, सिंचाई, उर्वरक\n\n**पूछने का प्रयास करें:**\n• मुंबई में मौसम कैसा है?\n• मिट्टी सूखी है और तापमान बढ़ रहा है\n• उच्च आर्द्रता के लिए फसलें सुझाएं\n• क्या मुझे अपने खेत की सिंचाई करनी चाहिए?";
    } else if (language === 'mr') {
      return "नमस्कार! मी तुमचा एआय-चालित हवामान आणि शेती सल्लागार आहे. मी यात मदत करू शकतो:\n\n🌤️ **हवामान अंदाज**\n• भारतीय राज्यांसाठी रिअल-टाइम अंदाज\n• तापमान, पाऊस, आर्द्रता डेटा\n\n🌾 **शेती सल्ला**\n• पीक/माती स्थितीचे विश्लेषण\n• एआय शिफारसी मिळवा\n• कीटक नियंत्रण, सिंचन, खत\n\n**विचारण्याचा प्रयत्न करा:**\n• मुंबईत हवामान कसे आहे?\n• माती कोरडी आहे आणि तापमान वाढत आहे\n• उच्च आर्द्रतेसाठी पिके सुचवा\n• मी माझ्या शेताला पाणी द्यावे का?";
    }
    return "Hello! I'm your AI-powered Climate & Agricultural Advisor. I can help with:\n\n🌤️ **Weather Forecasts**\n• Real-time forecasts for Indian states\n• Temperature, rainfall, humidity data\n\n🌾 **Farming Advice**\n• Analyze crop/soil conditions\n• Get AI recommendations\n• Pest control, irrigation, fertilization\n\n**Try asking:**\n• What's the weather in Mumbai?\n• Soil is dry and temperature rising\n• Suggest crops for high humidity\n• Should I irrigate my field?";
  };
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prev => [
      {
        ...prev[0],
        content: getWelcomeMessage(),
      },
      ...prev.slice(1),
    ]);
  }, [language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const indianStates = {
    'andhra pradesh': { lat: 15.9129, lon: 79.7400, capital: 'Amaravati' },
    'arunachal pradesh': { lat: 28.2180, lon: 94.7278, capital: 'Itanagar' },
    'assam': { lat: 26.2006, lon: 92.9376, capital: 'Dispur' },
    'bihar': { lat: 25.0961, lon: 85.3131, capital: 'Patna' },
    'chhattisgarh': { lat: 21.2787, lon: 81.8661, capital: 'Raipur' },
    'goa': { lat: 15.2993, lon: 74.1240, capital: 'Panaji' },
    'gujarat': { lat: 22.2587, lon: 71.1924, capital: 'Gandhinagar' },
    'haryana': { lat: 29.0588, lon: 76.0856, capital: 'Chandigarh' },
    'himachal pradesh': { lat: 31.1048, lon: 77.1734, capital: 'Shimla' },
    'jharkhand': { lat: 23.6102, lon: 85.2799, capital: 'Ranchi' },
    'karnataka': { lat: 15.3173, lon: 75.7139, capital: 'Bangalore' },
    'kerala': { lat: 10.8505, lon: 76.2711, capital: 'Thiruvananthapuram' },
    'madhya pradesh': { lat: 22.9734, lon: 78.6569, capital: 'Bhopal' },
    'maharashtra': { lat: 19.7515, lon: 75.7139, capital: 'Mumbai' },
    'manipur': { lat: 24.6637, lon: 93.9063, capital: 'Imphal' },
    'meghalaya': { lat: 25.4670, lon: 91.3662, capital: 'Shillong' },
    'mizoram': { lat: 23.1645, lon: 92.9376, capital: 'Aizawl' },
    'nagaland': { lat: 26.1584, lon: 94.5624, capital: 'Kohima' },
    'odisha': { lat: 20.9517, lon: 85.0985, capital: 'Bhubaneswar' },
    'punjab': { lat: 31.1471, lon: 75.3412, capital: 'Chandigarh' },
    'rajasthan': { lat: 27.0238, lon: 74.2179, capital: 'Jaipur' },
    'sikkim': { lat: 27.5330, lon: 88.5122, capital: 'Gangtok' },
    'tamil nadu': { lat: 11.1271, lon: 78.6569, capital: 'Chennai' },
    'telangana': { lat: 18.1124, lon: 79.0193, capital: 'Hyderabad' },
    'tripura': { lat: 23.9408, lon: 91.9882, capital: 'Agartala' },
    'uttar pradesh': { lat: 26.8467, lon: 80.9462, capital: 'Lucknow' },
    'uttarakhand': { lat: 30.0668, lon: 79.0193, capital: 'Dehradun' },
    'west bengal': { lat: 22.9868, lon: 87.8550, capital: 'Kolkata' },
    'delhi': { lat: 28.7041, lon: 77.1025, capital: 'New Delhi' },
    'jammu and kashmir': { lat: 33.7782, lon: 76.5762, capital: 'Srinagar' },
    'ladakh': { lat: 34.1526, lon: 77.5771, capital: 'Leh' },
    'puducherry': { lat: 11.9416, lon: 79.8083, capital: 'Puducherry' },
  };

  const detectStateInQuery = (query: string): string | null => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Create variations and aliases for better matching
    const stateAliases: { [key: string]: string } = {
      'mumbai': 'maharashtra',
      'pune': 'maharashtra',
      'bangalore': 'karnataka',
      'bengaluru': 'karnataka',
      'chennai': 'tamil nadu',
      'hyderabad': 'telangana',
      'kolkata': 'west bengal',
      'calcutta': 'west bengal',
      'lucknow': 'uttar pradesh',
      'up': 'uttar pradesh',
      'mp': 'madhya pradesh',
      'hp': 'himachal pradesh',
      'ap': 'andhra pradesh',
      'tn': 'tamil nadu',
      'wb': 'west bengal',
      'jk': 'jammu and kashmir',
      'kashmir': 'jammu and kashmir',
      'new delhi': 'delhi',
      'ncr': 'delhi',
      'chandigarh': 'punjab',
      'shimla': 'himachal pradesh',
      'jaipur': 'rajasthan',
      'ahmedabad': 'gujarat',
      'surat': 'gujarat',
      'kochi': 'kerala',
      'cochin': 'kerala',
      'thiruvananthapuram': 'kerala',
      'trivandrum': 'kerala',
      'bhubaneswar': 'odisha',
      'orissa': 'odisha',
      'patna': 'bihar',
      'ranchi': 'jharkhand',
      'raipur': 'chhattisgarh',
      'bhopal': 'madhya pradesh',
      'indore': 'madhya pradesh',
      'guwahati': 'assam',
      'dispur': 'assam',
      'gangtok': 'sikkim',
      'shillong': 'meghalaya',
      'imphal': 'manipur',
      'aizawl': 'mizoram',
      'kohima': 'nagaland',
      'agartala': 'tripura',
      'itanagar': 'arunachal pradesh',
      'panaji': 'goa',
      'panjim': 'goa',
      'amaravati': 'andhra pradesh',
      'vijayawada': 'andhra pradesh',
      'visakhapatnam': 'andhra pradesh',
      'vizag': 'andhra pradesh',
      'dehradun': 'uttarakhand',
      'leh': 'ladakh',
      'srinagar': 'jammu and kashmir',
      'pondicherry': 'puducherry',
      'pondy': 'puducherry',
    };
    
    // FIRST: Check for exact full state name matches (highest priority)
    for (const [state, _] of Object.entries(indianStates)) {
      if (lowerQuery.includes(state)) {
        return state;
      }
    }
    
    // SECOND: Check for city/alias matches
    for (const [alias, state] of Object.entries(stateAliases)) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(lowerQuery)) {
        return state;
      }
    }
    
    // THIRD: Check for partial matches (only if no exact match found)
    // This is for cases like "weather in uttar" -> "uttar pradesh"
    for (const [state, _] of Object.entries(indianStates)) {
      const stateWords = state.split(' ');
      // Only match if the first word is present (to avoid "pradesh" matching everything)
      if (stateWords.length > 1) {
        const firstWord = stateWords[0];
        if (firstWord.length > 4 && lowerQuery.includes(firstWord)) {
          return state;
        }
      }
    }
    
    return null;
  };

  const fetchClimateData = async (state: string) => {
    const stateInfo = indianStates[state as keyof typeof indianStates];
    if (!stateInfo) return null;

    try {
      // Fetch AI forecast
      const aiServerUrl = import.meta.env.VITE_AI_FORECAST_URL || 'http://localhost:3002';
      const response = await fetch(`${aiServerUrl}/api/ai-forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: stateInfo.lat,
          lon: stateInfo.lon,
          location: state.charAt(0).toUpperCase() + state.slice(1),
        }),
      });

      const data = await response.json();
      return { ...data, stateInfo };
    } catch (error) {
      console.error('Error fetching climate data:', error);
      return null;
    }
  };

  const generateResponse = (query: string, data: any, stateName: string) => {
    if (!data || !data.success) {
      return "I couldn't fetch the climate data. Please make sure the AI Forecast server is running on port 3002.";
    }

    const lowerQuery = query.toLowerCase();
    const state = data.location.name;
    const current = data.current;
    const monthly = data.forecast.monthly;
    const nextMonth = monthly[0];
    const futureMonth = monthly[monthly.length - 1];

    // Determine what user is asking about
    const askingAboutRainfall = lowerQuery.includes('rain') || lowerQuery.includes('precipitation') || lowerQuery.includes('monsoon');
    const askingAboutTemp = lowerQuery.includes('temp') || lowerQuery.includes('hot') || lowerQuery.includes('cold') || lowerQuery.includes('heat');
    const askingAboutHumidity = lowerQuery.includes('humid');
    const askingComparison = lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('versus');
    const askingGeneral = !askingAboutRainfall && !askingAboutTemp && !askingAboutHumidity;

    let response = `📍 **${state.toUpperCase()} Climate Forecast**\n\n`;

    // Current conditions (always show)
    if (current) {
      response += `🌤️ **Current Conditions:**\n`;
      response += `• Temperature: ${current.temperature}°C\n`;
      response += `• Humidity: ${current.humidity}%\n`;
      response += `• Conditions: ${current.description}\n\n`;
    }

    // Focused response based on query
    if (askingAboutRainfall) {
      response += `🌧️ **Rainfall Analysis:**\n`;
      response += `• Next Month (${nextMonth.month}): ${nextMonth.rainfall.predicted.toFixed(0)}mm\n`;
      const totalRain = monthly.reduce((sum: number, m: any) => sum + m.rainfall.predicted, 0);
      response += `• 6-Month Total: ${totalRain.toFixed(0)}mm\n`;
      const rainiestMonth = monthly.reduce((max: any, m: any) => 
        m.rainfall.predicted > max.rainfall.predicted ? m : max
      );
      response += `• Rainiest Month: ${rainiestMonth.month} (${rainiestMonth.rainfall.predicted.toFixed(0)}mm)\n\n`;
      
      if (totalRain < 300) {
        response += `💡 **Advisory:** Below-average rainfall expected. Water conservation and drought-resistant crops recommended.\n`;
      } else if (totalRain > 1000) {
        response += `💡 **Advisory:** Heavy rainfall expected. Monitor for flooding and plan drainage accordingly.\n`;
      } else {
        response += `💡 **Advisory:** Moderate rainfall expected. Good conditions for regular crop cultivation.\n`;
      }
    } else if (askingAboutTemp) {
      response += `🌡️ **Temperature Analysis:**\n`;
      response += `• Next Month (${nextMonth.month}): ${nextMonth.temperature.predicted.toFixed(1)}°C\n`;
      const avgTemp = monthly.reduce((sum: number, m: any) => sum + m.temperature.predicted, 0) / monthly.length;
      response += `• 6-Month Average: ${avgTemp.toFixed(1)}°C\n`;
      const hottestMonth = monthly.reduce((max: any, m: any) => 
        m.temperature.predicted > max.temperature.predicted ? m : max
      );
      response += `• Hottest Month: ${hottestMonth.month} (${hottestMonth.temperature.predicted.toFixed(1)}°C)\n\n`;
      
      if (avgTemp > 35) {
        response += `💡 **Advisory:** High temperatures expected. Heat stress likely for crops and livestock. Plan irrigation accordingly.\n`;
      } else if (avgTemp < 15) {
        response += `💡 **Advisory:** Cold temperatures expected. Protect sensitive crops from frost damage.\n`;
      } else {
        response += `💡 **Advisory:** Moderate temperatures expected. Favorable conditions for most crops.\n`;
      }
    } else {
      // General forecast
      response += `📅 **${nextMonth.month} Forecast:**\n`;
      response += `• Temperature: ${nextMonth.temperature.predicted.toFixed(1)}°C (${nextMonth.temperature.lower.toFixed(1)}°C - ${nextMonth.temperature.upper.toFixed(1)}°C)\n`;
      response += `• Rainfall: ${nextMonth.rainfall.predicted.toFixed(0)}mm\n`;
      response += `• Humidity: ${nextMonth.humidity.predicted.toFixed(0)}%\n\n`;

      // 6-month outlook
      const avgTemp = monthly.reduce((sum: number, m: any) => sum + m.temperature.predicted, 0) / monthly.length;
      const totalRain = monthly.reduce((sum: number, m: any) => sum + m.rainfall.predicted, 0);
      
      response += `📊 **6-Month Outlook (${nextMonth.month} - ${futureMonth.month}):**\n`;
      response += `• Average Temperature: ${avgTemp.toFixed(1)}°C\n`;
      response += `• Total Rainfall: ${totalRain.toFixed(0)}mm\n`;
      response += `• Peak Temperature: ${futureMonth.temperature.predicted.toFixed(1)}°C in ${futureMonth.month}\n\n`;

      // Insights
      response += `💡 **Key Insights:**\n`;
      if (avgTemp > 35) {
        response += `• ⚠️ High temperatures expected - heat stress likely\n`;
      }
      if (totalRain < 300) {
        response += `• 🌵 Below-average rainfall - water conservation advised\n`;
      } else if (totalRain > 1000) {
        response += `• 🌧️ Heavy rainfall expected - monitor for flooding\n`;
      }
      if (avgTemp > 30 && totalRain > 500) {
        response += `• 🌾 Good conditions for monsoon crops\n`;
      }
    }

    return response;
  };

  const detectQueryType = (query: string): 'weather' | 'farming' | 'analysis' => {
    const lowerQuery = query.toLowerCase();
    const weatherKeywords = ['weather', 'temperature', 'rain', 'forecast', 'climate', 'hot', 'cold'];
    const farmingKeywords = ['crop', 'suggest', 'recommend', 'best', 'suitable', 'plant'];
    const analysisKeywords = ['soil', 'dry', 'pest', 'disease', 'yellow', 'waterlog', 'drought'];
    
    if (analysisKeywords.some(word => lowerQuery.includes(word))) return 'analysis';
    if (farmingKeywords.some(word => lowerQuery.includes(word))) return 'farming';
    return 'weather';
  };

  const callAIBackend = async (query: string, type: 'analysis' | 'farming') => {
    try {
      const aiBackendUrl = 'http://localhost:8000';
      const endpoint = type === 'analysis' ? '/api/analyze-farm' : '/api/agri_analysis';
      
      // Add language instruction to the query
      const languageInstruction = language === 'hi' 
        ? ' (कृपया हिंदी में जवाब दें)' 
        : language === 'mr' 
        ? ' (कृपया मराठीत उत्तर द्या)'
        : '';
      
      const enhancedQuery = query + languageInstruction;
      const body = type === 'analysis' ? { text: enhancedQuery } : { text: enhancedQuery };
      
      const response = await fetch(`${aiBackendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('AI Backend unavailable');
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
      
      // Check if it's a weather query
      const state = detectStateInQuery(currentQuery);
      
      if (queryType === 'analysis') {
        // Use AI backend for farm analysis
        const aiResponse = await callAIBackend(currentQuery, 'analysis');
        
        if (aiResponse && aiResponse.analysis) {
          const recommendations = Array.isArray(aiResponse.analysis.recommendations) 
            ? aiResponse.analysis.recommendations.join('\n• ') 
            : aiResponse.analysis.recommendations || 'No specific recommendations available';
          
          const content = `🤖 **AI Analysis**\n\n**Condition Detected:** ${aiResponse.analysis.category || 'Unknown'}\n**Confidence:** ${((aiResponse.analysis.confidence || 0) * 100).toFixed(0)}%\n**Model:** ${aiResponse.model}\n\n**Recommendations:**\n• ${recommendations}\n\n💡 This analysis is based on your description.`;
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content,
            timestamp: new Date(),
            data: aiResponse,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error('AI analysis failed');
        }
      } else if (queryType === 'farming') {
        // Use AI backend for recommendations
        const aiResponse = await callAIBackend(currentQuery, 'farming');
        
        if (aiResponse && aiResponse.analysis) {
          const recommendations = Array.isArray(aiResponse.analysis.recommendations) 
            ? aiResponse.analysis.recommendations.join('\n• ') 
            : aiResponse.analysis.recommendations || 'No specific recommendations available';
          
          const content = `🌾 **AI Farming Recommendation**\n\n**Category:** ${aiResponse.analysis.category || 'General'}\n**Confidence:** ${((aiResponse.analysis.confidence || 0) * 100).toFixed(0)}%\n\n**Recommendations:**\n• ${recommendations}\n\n**Model:** ${aiResponse.model}\n**Generated:** ${new Date(aiResponse.timestamp).toLocaleTimeString()}`;
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content,
            timestamp: new Date(),
            data: aiResponse,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error('AI recommendation failed');
        }
      } else if (state) {
        // Weather forecast query
        const data = await fetchClimateData(state);
        const response = generateResponse(currentQuery, data, state);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          data: data,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // General query - try AI recommendation
        const aiResponse = await callAIBackend(currentQuery, 'farming');
        
        if (aiResponse && aiResponse.analysis) {
          const recommendations = Array.isArray(aiResponse.analysis.recommendations) 
            ? aiResponse.analysis.recommendations.join('\n• ') 
            : aiResponse.analysis.recommendations || 'No specific recommendations available';
          
          const content = `🤖 **AI Response**\n\n**Category:** ${aiResponse.analysis.category || 'General'}\n**Confidence:** ${((aiResponse.analysis.confidence || 0) * 100).toFixed(0)}%\n\n**Recommendations:**\n• ${recommendations}\n\n**Model:** ${aiResponse.model}`;
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content,
            timestamp: new Date(),
            data: aiResponse,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I can help with:\n\n🌤️ **Weather:** Mention a state/city\n🌾 **Farming:** Ask for crop recommendations\n🔬 **Analysis:** Describe your farm conditions\n\n**Examples:**\n• Weather in Mumbai\n• Soil is dry and hot\n• Suggest crops for high humidity",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error. Please try:\n• Asking about weather in a specific location\n• Describing your farm conditions\n• Requesting crop recommendations\n\nMake sure the AI backend is running on http://localhost:8000",
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
    t.chat.quickQuestion1,
    t.chat.quickQuestion2,
    t.chat.quickQuestion3,
    t.chat.quickQuestion4,
    t.chat.quickQuestion5,
    t.chat.quickQuestion6,
  ];

  return (
    <section className="py-20 px-4 min-h-screen">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Climate Intelligence Chat</h2>
          <p className="text-lg text-muted-foreground">
            Ask me about weather forecasts for any Indian state
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              AI Climate Assistant
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                Powered by NASA POWER & OpenWeather
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
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      {message.data?.current && (
                        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Thermometer className="w-3 h-3" />
                            {message.data.current.temperature}°C
                          </div>
                          <div className="flex items-center gap-1">
                            <CloudRain className="w-3 h-3" />
                            {message.data.forecast.monthly[0].rainfall.predicted.toFixed(0)}mm
                          </div>
                          <div className="flex items-center gap-1">
                            <Wind className="w-3 h-3" />
                            {message.data.current.humidity}%
                          </div>
                        </div>
                      )}
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
                        <span className="text-sm">{t.chat.fetchingData}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-6 pb-4">
                <p className="text-sm text-muted-foreground mb-2">{t.chat.quickQuestions}</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(question);
                        setTimeout(() => handleSend(), 100);
                      }}
                      className="text-xs"
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
                  placeholder={t.chat.placeholder}
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💬 {t.chat.askNaturally}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{t.chat.allStates}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t.chat.statesCovered}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">180-Day Predictions</span>
              </div>
              <p className="text-xs text-muted-foreground">
                6-month climate outlook with AI accuracy
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Real-Time Data</span>
              </div>
              <p className="text-xs text-muted-foreground">
                NASA POWER + OpenWeather integration
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ClimateChat;
