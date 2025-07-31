// src/app/api/generate-insight/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use the service role key for server-side operations that need elevated permissions
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('API Route ERROR: Environment variable NEXT_PUBLIC_SUPABASE_URL is not defined.');
}
if (!supabaseServiceRoleKey) { // Check for service role key
  console.error('API Route ERROR: Environment variable SUPABASE_SERVICE_ROLE_KEY is not defined.');
  // THIS IS CRITICAL. If this key is missing, the update will fail.
  // In production, you might want to throw an error here to prevent the API from running.
}

// Create Supabase client using the service role key
const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '');

// Initialize Google Generative AI
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error('API Route ERROR: Environment variable GEMINI_API_KEY is not defined.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey || '');

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: Request) {
  console.log('API Route: POST request received for /api/generate-insight');

  if (req.method !== 'POST') {
    console.log(`API Route: Method Not Allowed (${req.method})`);
    return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
  }

  interface RequestBody {
    id: string;
    content: string;
  }

  let requestBody: RequestBody;
  try {
    requestBody = await req.json();
    console.log('API Route: Parsed request body:', requestBody);
  } catch (jsonParseError: unknown) {
    let errorMessage = 'Failed to parse request body as JSON.';
    if (jsonParseError instanceof Error) {
      errorMessage = jsonParseError.message;
    }
    console.error('API Route ERROR: JSON parsing error:', errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }

  const { id, content } = requestBody;

  if (!id || typeof id !== 'string' || !content || typeof content !== 'string') {
    console.log('API Route: Missing or invalid journal entry ID or content in request body.');
    return NextResponse.json({ message: 'Missing or invalid journal entry ID or content.' }, { status: 400 });
  }

  let aiInsight: string | null = null;

  try {
    const prompt = `Analyze the following journal entry for mood, recurring themes, and provide a concise, supportive insight or suggestion for mental well-being. Focus on actionable advice or positive reframing. Keep it under 100 words:\n\n${content}`;
    console.log('API Route: Gemini prompt:', prompt);

    const generationConfig = {
      temperature: 0.7,
      topP: 1,
      topK: 1,
      maxOutputTokens: 200,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    console.log('API Route: Calling Gemini API...');
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });

    const response = result.response;
    aiInsight = response.text();
    console.log('API Route: Gemini API response (raw):', response);
    console.log('API Route: Extracted AI Insight:', aiInsight);

    if (!aiInsight || aiInsight.trim() === '') {
      console.warn('API Route WARNING: Gemini returned an empty or whitespace-only insight. Setting to null.');
      aiInsight = null;
    }

    console.log(`API Route: Attempting to update Supabase for ID: ${id} with insight length: ${aiInsight?.length || 0}`);
    // Using the service role key here bypasses RLS, ensuring the update goes through.
    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({ ai_insight: aiInsight })
      .eq('id', id);

    if (updateError) {
      console.error('API Route ERROR: Critical error updating Supabase with AI insight:', updateError);
      return NextResponse.json({ message: 'Failed to update journal with AI insight in Supabase.', error: updateError.message }, { status: 500 });
    }

    console.log('API Route: Supabase update successful.');
    return NextResponse.json({ message: 'AI insight generated and updated successfully!', aiInsight }, { status: 200 });

  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred during AI generation or update.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as { message: string }).message;
    }
    console.error('API Route CRITICAL ERROR: Uncaught exception in API route:', errorMessage, error);
    return NextResponse.json({ message: 'Internal Server Error during AI generation or update.', error: errorMessage }, { status: 500 });
  }
}
