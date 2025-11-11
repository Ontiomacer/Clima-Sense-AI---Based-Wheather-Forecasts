import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, Brain, Sparkles, Leaf } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  prediction?: string;
  confidence?: number;
  aiModel?: string;
}

const ClimateChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI-powered Agricultural & Climate Advisor powered by **AgriBERT** and **GraphCast** models.\n\n**I can help with:**\n🌾 Farm condition analysis\n💧 Irrigation planning\n🐛 Pest management\n🌱 Crop recommendations\n🌤️ Weather forecasts\n\n**Try asking:**\n• \"Soil is dry and temperature is rising\"\n• \"Suggest crops for high humidity\"\n• \"What's the weather in Punjab?\"\n• \"How to control pests organically?\"",
      timestamp: new Date(),
    },
  ]);
  const [input, s