import { Handler } from '@netlify/functions';
import { GoogleGenAI } from "@google/genai";
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

const SALES_PROMPT = `You are Alex, a professional AI sales assistant with expertise in qualifying leads and booking sales calls. Your personality is friendly, confident, and consultative.

Your primary goal is to:
1. Build rapport and understand the prospect's business needs
2. Qualify leads using the BANT framework (Budget, Authority, Need, Timeline)
3. Handle objections professionally
4. Guide qualified prospects toward booking a sales call
5. Extract contact information naturally during conversation

Guidelines:
- Keep responses conversational and under 100 words
- Ask one qualifying question at a time
- Listen actively and respond to what the prospect says
- Use consultative selling techniques
- Be helpful and provide value in every interaction
- If someone seems unqualified or uninterested, politely end the conversation

BANT Qualification Framework:
- Budget: Does the prospect have budget allocated for this type of solution?
- Authority: Is the prospect a decision-maker or influencer?
- Need: Does the prospect have a clear business need or pain point?
- Timeline: When is the prospect looking to implement a solution?

Score each BANT criterion from 0-10 based on the conversation.

For each response, also provide:
- A lead score assessment
- Any contact information gathered
- Conversation insights

Always respond in a helpful, professional manner that moves the conversation toward qualification and booking.`;

// Google Sheets logging functionality
class SheetsService {
  private auth: GoogleAuth;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
    
    let credentials;
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
        if (keyString.startsWith('{')) {
          credentials = JSON.parse(keyString);
        } else {
          const decoded = Buffer.from(keyString, 'base64').toString('utf-8');
          credentials = JSON.parse(decoded);
        }
      }
    } catch (error) {
      console.warn('Failed to parse Google Service Account Key');
      credentials = undefined;
    }

    this.auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  async logConversation(entry: any): Promise<void> {
    try {
      if (!this.spreadsheetId) return;

      const authClient = await this.auth.getClient();
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      const leadScore = entry.leadScore || {};
      const contactInfo = entry.contactInfo || {};
      
      const painPoints = this.extractPainPoints(entry.userMessage, entry.aiResponse);
      const budgetRange = this.extractBudgetInfo(entry.userMessage, entry.aiResponse);
      const timeline = this.extractTimeline(entry.userMessage, entry.aiResponse);
      const industry = this.extractIndustry(contactInfo.company || '');
      const companySize = this.extractCompanySize(entry.userMessage, entry.aiResponse);
      const keyInsights = this.extractKeyInsights(entry.userMessage, entry.aiResponse);
      const nextActions = this.determineNextActions(leadScore, contactInfo);

      const values = [[
        new Date(entry.timestamp).toISOString(),
        entry.sessionId,
        leadScore.overall || 0,
        leadScore.budget || 0,
        leadScore.authority || 0,
        leadScore.need || 0,
        leadScore.timeline || 0,
        contactInfo.name || '',
        contactInfo.company || '',
        contactInfo.email || '',
        contactInfo.phone || '',
        contactInfo.title || '',
        painPoints,
        budgetRange,
        timeline,
        this.getQualificationStatus(leadScore),
        keyInsights,
        nextActions,
        industry,
        companySize,
        'Website Chat',
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Conversations!A:U',
        valueInputOption: 'RAW',
        resource: { values },
      });
    } catch (error) {
      console.error('Failed to log conversation:', error);
    }
  }

  private extractPainPoints(userMessage: string, aiResponse: string): string {
    const painKeywords = ['problem', 'issue', 'challenge', 'struggle', 'difficult', 'pain', 'frustrat', 'concern', 'worry'];
    const sentences = userMessage.split(/[.!?]+/);
    const painSentences = sentences.filter(sentence => 
      painKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    return painSentences.slice(0, 2).join('. ').trim();
  }

  private extractBudgetInfo(userMessage: string, aiResponse: string): string {
    const budgetRegex = /(\$[\d,]+|\d+k|\d+\s*(dollars|k|thousand|million))/gi;
    const combined = `${userMessage} ${aiResponse}`;
    const matches = combined.match(budgetRegex);
    return matches ? matches[0] : '';
  }

  private extractTimeline(userMessage: string, aiResponse: string): string {
    const timelineKeywords = ['asap', 'immediately', 'urgent', 'next month', 'quarter', 'year', 'soon', 'weeks', 'months'];
    const combined = `${userMessage} ${aiResponse}`.toLowerCase();
    const foundTimeline = timelineKeywords.find(keyword => combined.includes(keyword));
    return foundTimeline || '';
  }

  private extractIndustry(company: string): string {
    const industryMap = {
      'tech': ['tech', 'software', 'app', 'digital', 'startup'],
      'healthcare': ['health', 'medical', 'clinic', 'hospital'],
      'finance': ['bank', 'finance', 'investment', 'capital'],
      'retail': ['store', 'shop', 'retail', 'commerce'],
    };

    const companyLower = company.toLowerCase();
    for (const [industry, keywords] of Object.entries(industryMap)) {
      if (keywords.some(keyword => companyLower.includes(keyword))) {
        return industry;
      }
    }
    return '';
  }

  private extractCompanySize(userMessage: string, aiResponse: string): string {
    const combined = `${userMessage} ${aiResponse}`.toLowerCase();
    if (combined.includes('startup') || combined.includes('small business')) return 'Small (1-50)';
    if (combined.includes('medium') || combined.includes('growing')) return 'Medium (51-200)';
    if (combined.includes('enterprise') || combined.includes('large')) return 'Large (200+)';
    return '';
  }

  private extractKeyInsights(userMessage: string, aiResponse: string): string {
    const insights = [];
    const combined = `${userMessage} ${aiResponse}`.toLowerCase();
    
    if (combined.includes('competitor')) insights.push('Has alternatives in mind');
    if (combined.includes('decision maker') || combined.includes('ceo')) insights.push('Decision maker');
    if (combined.includes('urgent')) insights.push('Urgent need');
    if (combined.includes('budget') || combined.includes('price')) insights.push('Price conscious');
    
    return insights.slice(0, 3).join(', ');
  }

  private determineNextActions(leadScore: any, contactInfo: any): string {
    const score = leadScore.overall || 0;
    const hasContact = contactInfo.email || contactInfo.phone;
    
    if (score >= 8 && hasContact) return 'Schedule demo call immediately';
    if (score >= 6 && hasContact) return 'Send detailed proposal';
    if (score >= 4) return 'Continue qualification, gather contact info';
    if (score < 4 && hasContact) return 'Add to nurture campaign';
    return 'Continue conversation to increase qualification';
  }

  private getQualificationStatus(leadScore: any): string {
    const score = leadScore.overall || 0;
    if (score >= 8) return 'Hot Lead';
    if (score >= 6) return 'Warm Lead';
    if (score >= 4) return 'Qualified';
    return 'Unqualified';
  }
}

const sheetsService = new SheetsService();

export const handler: Handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    const { message, sessionId } = JSON.parse(event.body || '{}');

    if (!message || !sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields: message and sessionId' }),
      };
    }

    const prompt = `${SALES_PROMPT}

User: ${message}

Respond as Alex and provide:
1. A natural, conversational response
2. Lead qualification scores (0-10 for Budget, Authority, Need, Timeline)
3. Any contact information gathered from the conversation

Respond in JSON format:
{
  "response": "your conversational response",
  "leadScore": {
    "budget": 0-10,
    "authority": 0-10,
    "need": 0-10,
    "timeline": 0-10
  },
  "contactInfo": {
    "name": "if mentioned",
    "email": "if mentioned",
    "phone": "if mentioned",
    "company": "if mentioned",
    "title": "if mentioned"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            response: { type: "string" },
            leadScore: {
              type: "object",
              properties: {
                budget: { type: "number" },
                authority: { type: "number" },
                need: { type: "number" },
                timeline: { type: "number" },
              },
            },
            contactInfo: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                company: { type: "string" },
                title: { type: "string" },
              },
            },
          },
          required: ["response"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const data = JSON.parse(rawJson);

    // Calculate overall lead score
    if (data.leadScore) {
      const { budget, authority, need, timeline } = data.leadScore;
      data.leadScore.overall = (budget + authority + need + timeline) / 4;
    }

    // Log to Google Sheets
    await sheetsService.logConversation({
      sessionId,
      userMessage: message,
      aiResponse: data.response,
      leadScore: data.leadScore,
      contactInfo: data.contactInfo,
      timestamp: new Date(),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: error.message || 'Internal server error',
        response: "I apologize, but I'm experiencing some technical difficulties. Let me try to help you another way - could you tell me about your business needs?",
        leadScore: { budget: 0, authority: 0, need: 0, timeline: 0, overall: 0 },
      }),
    };
  }
};