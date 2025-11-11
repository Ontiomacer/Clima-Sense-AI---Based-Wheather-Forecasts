import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GEERequest {
  dataset: 'rainfall' | 'ndvi' | 'temperature';
  startDate: string;
  endDate: string;
  region?: {
    type: string;
    coordinates: number[][][];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { dataset, startDate, endDate, region }: GEERequest = await req.json();
    
    // Get GEE service account from environment
    const geeServiceAccount = Deno.env.get('GEE_SERVICE_ACCOUNT_JSON');
    const geeProjectId = Deno.env.get('GEE_PROJECT_ID') || 'massive-hexagon-452605-m0';
    
    if (!geeServiceAccount) {
      throw new Error('GEE_SERVICE_ACCOUNT_JSON not configured');
    }

    const serviceAccount = JSON.parse(geeServiceAccount);
    
    // Get OAuth token for GEE
    const token = await getGEEToken(serviceAccount);
    
    // Fetch data based on dataset type
    let imageCollection: string;
    let visParams: any;
    let bandName: string;
    
    switch (dataset) {
      case 'rainfall':
        imageCollection = 'UCSB-CHG/CHIRPS/DAILY';
        bandName = 'precipitation';
        visParams = {
          min: 0,
          max: 50,
          palette: ['white', 'blue', 'darkblue', 'purple']
        };
        break;
      case 'ndvi':
        imageCollection = 'MODIS/061/MOD13Q1';
        bandName = 'NDVI';
        visParams = {
          min: 0,
          max: 9000,
          palette: ['brown', 'yellow', 'green', 'darkgreen']
        };
        break;
      case 'temperature':
        imageCollection = 'ECMWF/ERA5_LAND/MONTHLY_AGGREGATED';
        bandName = 'temperature_2m';
        visParams = {
          min: 250,
          max: 320,
          palette: ['blue', 'cyan', 'yellow', 'red']
        };
        break;
      default:
        throw new Error('Invalid dataset type');
    }

    // Build Earth Engine API request
    const eeApiUrl = 'https://earthengine.googleapis.com/v1alpha/projects/' + geeProjectId + ':computePixels';
    
    const expression = {
      expression: {
        functionInvocationValue: {
          functionName: 'ImageCollection.getMapId',
          arguments: {
            imageCollection: {
              functionInvocationValue: {
                functionName: 'ImageCollection.load',
                arguments: {
                  id: { constantValue: imageCollection }
                }
              }
            },
            visParams: { constantValue: visParams }
          }
        }
      }
    };

    const eeResponse = await fetch(eeApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expression)
    });

    if (!eeResponse.ok) {
      const errorText = await eeResponse.text();
      throw new Error(`GEE API error: ${errorText}`);
    }

    const data = await eeResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        mapId: data.name,
        token: data.token,
        tileUrl: `https://earthengine.googleapis.com/v1alpha/${data.name}/tiles/{z}/{x}/{y}`,
        dataset,
        startDate,
        endDate,
        visParams
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function getGEEToken(serviceAccount: any): Promise<string> {
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  
  const jwtClaimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/earthengine.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  
  const jwtClaimSetEncoded = btoa(JSON.stringify(jwtClaimSet));
  const signatureInput = `${jwtHeader}.${jwtClaimSetEncoded}`;
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
  
  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );
  
  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${signatureInput}.${signatureEncoded}`;
  
  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
