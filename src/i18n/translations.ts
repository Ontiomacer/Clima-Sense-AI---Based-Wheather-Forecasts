export type Language = 'en' | 'hi' | 'mr';

export interface Translations {
  // Navigation
  nav: {
    home: string;
    dashboard: string;
    agriculture: string;
    forecast: string;
    chat: string;
    about: string;
  };
  // Common
  common: {
    loading: string;
    error: string;
    retry: string;
    close: string;
    save: string;
    cancel: string;
    submit: string;
    search: string;
    filter: string;
    export: string;
    download: string;
  };
  // Home Page
  home: {
    title: string;
    subtitle: string;
    getStarted: string;
    learnMore: string;
    features: {
      title: string;
      aiPowered: string;
      aiPoweredDesc: string;
      realTime: string;
      realTimeDesc: string;
      satellite: string;
      satelliteDesc: string;
    };
  };
  // Agriculture Dashboard
  agriculture: {
    title: string;
    selectRegion: string;
    selectCrop: string;
    selectSeason: string;
    cropHealth: string;
    soilMoisture: string;
    temperature: string;
    rainfall: string;
    aiAdvisory: string;
    recommendations: string;
    predictedYield: string;
    riskScore: string;
    confidence: string;
  };
  // Weather Forecast
  forecast: {
    title: string;
    selectLocation: string;
    days: string;
    temperature: string;
    precipitation: string;
    humidity: string;
    windSpeed: string;
    forecast7Day: string;
    forecast10Day: string;
    today: string;
    tomorrow: string;
  };
  // Chat
  chat: {
    title: string;
    placeholder: string;
    send: string;
    typing: string;
    newChat: string;
    clearHistory: string;
    quickQuestions: string;
    fetchingData: string;
    askNaturally: string;
    allStates: string;
    statesCovered: string;
    quickQuestion1: string;
    quickQuestion2: string;
    quickQuestion3: string;
    quickQuestion4: string;
    quickQuestion5: string;
    quickQuestion6: string;
  };
  // Dashboard
  dashboard: {
    title: string;
    subtitle: string;
    currentAvgTemp: string;
    rainfall30Day: string;
    avgWindSpeed: string;
    vegetationHealth: string;
    ndvi: string;
    aiClimateRiskIndex: string;
    riskAssessment: string;
    moderate: string;
    low: string;
    high: string;
    keyInsights: string;
    aiRecommendations: string;
    waterConservation: string;
    temperatureRising: string;
    vegetationStrong: string;
    rainfallBelow: string;
    expectedAbove: string;
    next30Days: string;
    next14Days: string;
  };
  // Map Page
  map: {
    title: string;
    subtitle: string;
    selectLayer: string;
    satellite: string;
    temperature: string;
    precipitation: string;
    vegetation: string;
    legend: string;
    zoomIn: string;
    zoomOut: string;
    resetView: string;
  };
  // Contact Page
  contact: {
    title: string;
    subtitle: string;
    getInTouch: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    sendMessage: string;
    sending: string;
    messageSent: string;
    messageError: string;
    address: string;
    phone: string;
    emailLabel: string;
    followUs: string;
  };
  // Language Selector
  language: {
    select: string;
    english: string;
    hindi: string;
    marathi: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      agriculture: 'Agriculture',
      forecast: 'Forecast',
      chat: 'AI Chat',
      about: 'About',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      download: 'Download',
    },
    home: {
      title: 'ClimaSense AI',
      subtitle: 'AI-Powered Climate Intelligence for Smart Agriculture',
      getStarted: 'Get Started',
      learnMore: 'Learn More',
      features: {
        title: 'Features',
        aiPowered: 'AI-Powered Analysis',
        aiPoweredDesc: 'Advanced machine learning models for accurate predictions',
        realTime: 'Real-Time Data',
        realTimeDesc: 'Live weather and satellite data integration',
        satellite: 'Satellite Imagery',
        satelliteDesc: 'High-resolution Earth observation data',
      },
    },
    agriculture: {
      title: 'Agriculture Dashboard',
      selectRegion: 'Select Region',
      selectCrop: 'Select Crop',
      selectSeason: 'Select Season',
      cropHealth: 'Crop Health',
      soilMoisture: 'Soil Moisture',
      temperature: 'Temperature',
      rainfall: 'Rainfall',
      aiAdvisory: 'AI Advisory',
      recommendations: 'Recommendations',
      predictedYield: 'Predicted Yield',
      riskScore: 'Risk Score',
      confidence: 'Confidence',
    },
    forecast: {
      title: 'Weather Forecast',
      selectLocation: 'Select Location',
      days: 'Days',
      temperature: 'Temperature',
      precipitation: 'Precipitation',
      humidity: 'Humidity',
      windSpeed: 'Wind Speed',
      forecast7Day: '7-Day Forecast',
      forecast10Day: '10-Day Forecast',
      today: 'Today',
      tomorrow: 'Tomorrow',
    },
    chat: {
      title: 'AI Assistant',
      placeholder: 'Ask me anything about agriculture, weather, or climate...',
      send: 'Send',
      typing: 'AI is typing...',
      newChat: 'New Chat',
      clearHistory: 'Clear History',
      quickQuestions: 'Quick questions:',
      fetchingData: 'Fetching real-time climate data...',
      askNaturally: 'Ask in natural language • Cities & states supported • Abbreviations work too',
      allStates: 'All Indian States',
      statesCovered: '28 states + 8 union territories covered',
      quickQuestion1: 'Weather in Mumbai',
      quickQuestion2: 'Soil is dry and hot',
      quickQuestion3: 'Suggest crops for high humidity',
      quickQuestion4: 'Should I irrigate my field?',
      quickQuestion5: 'Rainfall in Kerala',
      quickQuestion6: 'How to control pests?',
    },
    dashboard: {
      title: 'Climate Intelligence Dashboard',
      subtitle: 'Real-time climate metrics powered by CHIRPS, OpenWeather, and satellite data',
      currentAvgTemp: 'Current avg. temperature',
      rainfall30Day: '30-day CHIRPS data',
      avgWindSpeed: 'Average wind speed',
      vegetationHealth: 'Vegetation health index',
      ndvi: 'NDVI',
      aiClimateRiskIndex: 'AI Climate Risk Index',
      riskAssessment: 'Current risk assessment based on multiple factors',
      moderate: 'Moderate',
      low: 'Low',
      high: 'High',
      keyInsights: 'Key Insights',
      aiRecommendations: 'AI-driven recommendations for the next 30 days',
      waterConservation: 'Water Conservation Priority',
      temperatureRising: 'Temperature Rising Trend',
      vegetationStrong: 'Vegetation Health Strong',
      rainfallBelow: 'Rainfall 12% below seasonal average',
      expectedAbove: 'Expected +2.5°C above normal in next 14 days',
      next30Days: 'for the next 30 days',
      next14Days: 'in next 14 days',
    },
    map: {
      title: 'Interactive Climate Map',
      subtitle: 'Explore real-time climate data with satellite imagery',
      selectLayer: 'Select Layer',
      satellite: 'Satellite View',
      temperature: 'Temperature',
      precipitation: 'Precipitation',
      vegetation: 'Vegetation (NDVI)',
      legend: 'Legend',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      resetView: 'Reset View',
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'Get in touch with our team',
      getInTouch: 'Get In Touch',
      name: 'Name',
      email: 'Email',
      subject: 'Subject',
      message: 'Message',
      sendMessage: 'Send Message',
      sending: 'Sending...',
      messageSent: 'Message sent successfully!',
      messageError: 'Failed to send message. Please try again.',
      address: 'Address',
      phone: 'Phone',
      emailLabel: 'Email',
      followUs: 'Follow Us',
    },
    language: {
      select: 'Language',
      english: 'English',
      hindi: 'हिंदी',
      marathi: 'मराठी',
    },
  },
  hi: {
    nav: {
      home: 'होम',
      dashboard: 'डैशबोर्ड',
      agriculture: 'कृषि',
      forecast: 'पूर्वानुमान',
      chat: 'एआई चैट',
      about: 'के बारे में',
    },
    common: {
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      retry: 'पुनः प्रयास करें',
      close: 'बंद करें',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      submit: 'जमा करें',
      search: 'खोजें',
      filter: 'फ़िल्टर',
      export: 'निर्यात',
      download: 'डाउनलोड',
    },
    home: {
      title: 'क्लाइमासेंस एआई',
      subtitle: 'स्मार्ट कृषि के लिए एआई-संचालित जलवायु बुद्धिमत्ता',
      getStarted: 'शुरू करें',
      learnMore: 'और जानें',
      features: {
        title: 'विशेषताएं',
        aiPowered: 'एआई-संचालित विश्लेषण',
        aiPoweredDesc: 'सटीक भविष्यवाणियों के लिए उन्नत मशीन लर्निंग मॉडल',
        realTime: 'रीयल-टाइम डेटा',
        realTimeDesc: 'लाइव मौसम और उपग्रह डेटा एकीकरण',
        satellite: 'उपग्रह इमेजरी',
        satelliteDesc: 'उच्च-रिज़ॉल्यूशन पृथ्वी अवलोकन डेटा',
      },
    },
    agriculture: {
      title: 'कृषि डैशबोर्ड',
      selectRegion: 'क्षेत्र चुनें',
      selectCrop: 'फसल चुनें',
      selectSeason: 'मौसम चुनें',
      cropHealth: 'फसल स्वास्थ्य',
      soilMoisture: 'मिट्टी की नमी',
      temperature: 'तापमान',
      rainfall: 'वर्षा',
      aiAdvisory: 'एआई सलाह',
      recommendations: 'सिफारिशें',
      predictedYield: 'अनुमानित उपज',
      riskScore: 'जोखिम स्कोर',
      confidence: 'विश्वास',
    },
    forecast: {
      title: 'मौसम पूर्वानुमान',
      selectLocation: 'स्थान चुनें',
      days: 'दिन',
      temperature: 'तापमान',
      precipitation: 'वर्षा',
      humidity: 'आर्द्रता',
      windSpeed: 'हवा की गति',
      forecast7Day: '7-दिन का पूर्वानुमान',
      forecast10Day: '10-दिन का पूर्वानुमान',
      today: 'आज',
      tomorrow: 'कल',
    },
    chat: {
      title: 'एआई सहायक',
      placeholder: 'कृषि, मौसम या जलवायु के बारे में कुछ भी पूछें...',
      send: 'भेजें',
      typing: 'एआई टाइप कर रहा है...',
      newChat: 'नई चैट',
      clearHistory: 'इतिहास साफ़ करें',
      quickQuestions: 'त्वरित प्रश्न:',
      fetchingData: 'रीयल-टाइम जलवायु डेटा प्राप्त कर रहे हैं...',
      askNaturally: 'प्राकृतिक भाषा में पूछें • शहर और राज्य समर्थित • संक्षिप्ताक्षर भी काम करते हैं',
      allStates: 'सभी भारतीय राज्य',
      statesCovered: '28 राज्य + 8 केंद्र शासित प्रदेश कवर किए गए',
      quickQuestion1: 'मुंबई में मौसम',
      quickQuestion2: 'मिट्टी सूखी है और गर्म है',
      quickQuestion3: 'उच्च आर्द्रता के लिए फसलें सुझाएं',
      quickQuestion4: 'क्या मुझे अपने खेत की सिंचाई करनी चाहिए?',
      quickQuestion5: 'केरल में वर्षा',
      quickQuestion6: 'कीटों को कैसे नियंत्रित करें?',
    },
    dashboard: {
      title: 'जलवायु बुद्धिमत्ता डैशबोर्ड',
      subtitle: 'CHIRPS, OpenWeather और उपग्रह डेटा द्वारा संचालित रीयल-टाइम जलवायु मेट्रिक्स',
      currentAvgTemp: 'वर्तमान औसत तापमान',
      rainfall30Day: '30-दिन का CHIRPS डेटा',
      avgWindSpeed: 'औसत हवा की गति',
      vegetationHealth: 'वनस्पति स्वास्थ्य सूचकांक',
      ndvi: 'NDVI',
      aiClimateRiskIndex: 'एआई जलवायु जोखिम सूचकांक',
      riskAssessment: 'कई कारकों के आधार पर वर्तमान जोखिम मूल्यांकन',
      moderate: 'मध्यम',
      low: 'कम',
      high: 'उच्च',
      keyInsights: 'मुख्य अंतर्दृष्टि',
      aiRecommendations: 'अगले 30 दिनों के लिए एआई-संचालित सिफारिशें',
      waterConservation: 'जल संरक्षण प्राथमिकता',
      temperatureRising: 'तापमान बढ़ने की प्रवृत्ति',
      vegetationStrong: 'वनस्पति स्वास्थ्य मजबूत',
      rainfallBelow: 'मौसमी औसत से 12% कम वर्षा',
      expectedAbove: 'अगले 14 दिनों में सामान्य से +2.5°C अधिक अपेक्षित',
      next30Days: 'अगले 30 दिनों के लिए',
      next14Days: 'अगले 14 दिनों में',
    },
    map: {
      title: 'इंटरैक्टिव जलवायु मानचित्र',
      subtitle: 'उपग्रह इमेजरी के साथ रीयल-टाइम जलवायु डेटा देखें',
      selectLayer: 'परत चुनें',
      satellite: 'उपग्रह दृश्य',
      temperature: 'तापमान',
      precipitation: 'वर्षा',
      vegetation: 'वनस्पति (NDVI)',
      legend: 'लीजेंड',
      zoomIn: 'ज़ूम इन',
      zoomOut: 'ज़ूम आउट',
      resetView: 'दृश्य रीसेट करें',
    },
    contact: {
      title: 'संपर्क करें',
      subtitle: 'हमारी टीम से संपर्क करें',
      getInTouch: 'संपर्क में रहें',
      name: 'नाम',
      email: 'ईमेल',
      subject: 'विषय',
      message: 'संदेश',
      sendMessage: 'संदेश भेजें',
      sending: 'भेजा जा रहा है...',
      messageSent: 'संदेश सफलतापूर्वक भेजा गया!',
      messageError: 'संदेश भेजने में विफल। कृपया पुनः प्रयास करें।',
      address: 'पता',
      phone: 'फ़ोन',
      emailLabel: 'ईमेल',
      followUs: 'हमें फॉलो करें',
    },
    language: {
      select: 'भाषा',
      english: 'English',
      hindi: 'हिंदी',
      marathi: 'मराठी',
    },
  },
  mr: {
    nav: {
      home: 'मुख्यपृष्ठ',
      dashboard: 'डॅशबोर्ड',
      agriculture: 'शेती',
      forecast: 'अंदाज',
      chat: 'एआय चॅट',
      about: 'बद्दल',
    },
    common: {
      loading: 'लोड होत आहे...',
      error: 'त्रुटी',
      retry: 'पुन्हा प्रयत्न करा',
      close: 'बंद करा',
      save: 'जतन करा',
      cancel: 'रद्द करा',
      submit: 'सबमिट करा',
      search: 'शोधा',
      filter: 'फिल्टर',
      export: 'निर्यात',
      download: 'डाउनलोड',
    },
    home: {
      title: 'क्लायमासेन्स एआय',
      subtitle: 'स्मार्ट शेतीसाठी एआय-चालित हवामान बुद्धिमत्ता',
      getStarted: 'सुरू करा',
      learnMore: 'अधिक जाणून घ्या',
      features: {
        title: 'वैशिष्ट्ये',
        aiPowered: 'एआय-चालित विश्लेषण',
        aiPoweredDesc: 'अचूक अंदाजांसाठी प्रगत मशीन लर्निंग मॉडेल',
        realTime: 'रिअल-टाइम डेटा',
        realTimeDesc: 'थेट हवामान आणि उपग्रह डेटा एकत्रीकरण',
        satellite: 'उपग्रह प्रतिमा',
        satelliteDesc: 'उच्च-रिझोल्यूशन पृथ्वी निरीक्षण डेटा',
      },
    },
    agriculture: {
      title: 'शेती डॅशबोर्ड',
      selectRegion: 'प्रदेश निवडा',
      selectCrop: 'पीक निवडा',
      selectSeason: 'हंगाम निवडा',
      cropHealth: 'पीक आरोग्य',
      soilMoisture: 'मातीची ओलावा',
      temperature: 'तापमान',
      rainfall: 'पाऊस',
      aiAdvisory: 'एआय सल्ला',
      recommendations: 'शिफारसी',
      predictedYield: 'अंदाजित उत्पन्न',
      riskScore: 'जोखीम स्कोअर',
      confidence: 'विश्वास',
    },
    forecast: {
      title: 'हवामान अंदाज',
      selectLocation: 'स्थान निवडा',
      days: 'दिवस',
      temperature: 'तापमान',
      precipitation: 'पर्जन्य',
      humidity: 'आर्द्रता',
      windSpeed: 'वाऱ्याचा वेग',
      forecast7Day: '७-दिवसांचा अंदाज',
      forecast10Day: '१०-दिवसांचा अंदाज',
      today: 'आज',
      tomorrow: 'उद्या',
    },
    chat: {
      title: 'एआय सहाय्यक',
      placeholder: 'शेती, हवामान किंवा हवामानाबद्दल काहीही विचारा...',
      send: 'पाठवा',
      typing: 'एआय टाइप करत आहे...',
      newChat: 'नवीन चॅट',
      clearHistory: 'इतिहास साफ करा',
      quickQuestions: 'द्रुत प्रश्न:',
      fetchingData: 'रिअल-टाइम हवामान डेटा मिळवत आहे...',
      askNaturally: 'नैसर्गिक भाषेत विचारा • शहरे आणि राज्ये समर्थित • संक्षेप देखील कार्य करतात',
      allStates: 'सर्व भारतीय राज्ये',
      statesCovered: '28 राज्ये + 8 केंद्रशासित प्रदेश कव्हर केले',
      quickQuestion1: 'मुंबईत हवामान',
      quickQuestion2: 'माती कोरडी आणि गरम आहे',
      quickQuestion3: 'उच्च आर्द्रतेसाठी पिके सुचवा',
      quickQuestion4: 'मी माझ्या शेताला पाणी द्यावे का?',
      quickQuestion5: 'केरळमध्ये पाऊस',
      quickQuestion6: 'कीटक कसे नियंत्रित करावे?',
    },
    dashboard: {
      title: 'हवामान बुद्धिमत्ता डॅशबोर्ड',
      subtitle: 'CHIRPS, OpenWeather आणि उपग्रह डेटाद्वारे चालित रिअल-टाइम हवामान मेट्रिक्स',
      currentAvgTemp: 'सध्याचे सरासरी तापमान',
      rainfall30Day: '30-दिवसांचा CHIRPS डेटा',
      avgWindSpeed: 'सरासरी वाऱ्याचा वेग',
      vegetationHealth: 'वनस्पती आरोग्य निर्देशांक',
      ndvi: 'NDVI',
      aiClimateRiskIndex: 'एआय हवामान जोखीम निर्देशांक',
      riskAssessment: 'अनेक घटकांवर आधारित सध्याचे जोखीम मूल्यांकन',
      moderate: 'मध्यम',
      low: 'कमी',
      high: 'उच्च',
      keyInsights: 'मुख्य अंतर्दृष्टी',
      aiRecommendations: 'पुढील 30 दिवसांसाठी एआय-चालित शिफारसी',
      waterConservation: 'जल संवर्धन प्राथमिकता',
      temperatureRising: 'तापमान वाढण्याचा ट्रेंड',
      vegetationStrong: 'वनस्पती आरोग्य मजबूत',
      rainfallBelow: 'हंगामी सरासरीपेक्षा 12% कमी पाऊस',
      expectedAbove: 'पुढील 14 दिवसांत सामान्यपेक्षा +2.5°C जास्त अपेक्षित',
      next30Days: 'पुढील 30 दिवसांसाठी',
      next14Days: 'पुढील 14 दिवसांत',
    },
    map: {
      title: 'परस्परसंवादी हवामान नकाशा',
      subtitle: 'उपग्रह प्रतिमांसह रिअल-टाइम हवामान डेटा पहा',
      selectLayer: 'लेयर निवडा',
      satellite: 'उपग्रह दृश्य',
      temperature: 'तापमान',
      precipitation: 'पर्जन्य',
      vegetation: 'वनस्पती (NDVI)',
      legend: 'लीजेंड',
      zoomIn: 'झूम इन',
      zoomOut: 'झूम आउट',
      resetView: 'दृश्य रीसेट करा',
    },
    contact: {
      title: 'संपर्क साधा',
      subtitle: 'आमच्या टीमशी संपर्क साधा',
      getInTouch: 'संपर्कात रहा',
      name: 'नाव',
      email: 'ईमेल',
      subject: 'विषय',
      message: 'संदेश',
      sendMessage: 'संदेश पाठवा',
      sending: 'पाठवत आहे...',
      messageSent: 'संदेश यशस्वीरित्या पाठवला!',
      messageError: 'संदेश पाठवण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
      address: 'पत्ता',
      phone: 'फोन',
      emailLabel: 'ईमेल',
      followUs: 'आम्हाला फॉलो करा',
    },
    language: {
      select: 'भाषा',
      english: 'English',
      hindi: 'हिंदी',
      marathi: 'मराठी',
    },
  },
};
