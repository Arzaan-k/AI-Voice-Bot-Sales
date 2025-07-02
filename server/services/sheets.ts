import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

interface ConversationLogEntry {
  sessionId: string;
  userMessage: string;
  aiResponse: string;
  leadScore: any;
  contactInfo: any;
  timestamp: Date;
}

interface CallBookingEntry {
  sessionId: string;
  contactInfo: any;
  bookingInfo: any;
  leadScore: any;
  timestamp: Date;
}

class SheetsService {
  private auth: GoogleAuth;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
    
    // Initialize Google Auth with better error handling
    let credentials;
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        // Try to parse the service account key
        const keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
        
        // Check if it's already JSON
        if (keyString.startsWith('{')) {
          credentials = JSON.parse(keyString);
          console.log('Successfully parsed Google Service Account Key');
        } else {
          // Try base64 decode
          try {
            const decoded = Buffer.from(keyString, 'base64').toString('utf-8');
            credentials = JSON.parse(decoded);
            console.log('Successfully decoded and parsed Google Service Account Key');
          } catch {
            console.warn('Could not parse Google Service Account Key. Please ensure it is valid JSON format.');
            credentials = undefined;
          }
        }
      } else {
        console.warn('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not found');
      }
    } catch (error: any) {
      console.error('Failed to parse Google Service Account Key:', error?.message || error);
      credentials = undefined;
    }

    this.auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  async logConversation(entry: ConversationLogEntry): Promise<void> {
    try {
      if (!this.spreadsheetId) {
        console.warn('Google Sheets ID not configured, skipping logging');
        return;
      }

      const authClient = await this.auth.getClient();
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      // Extract actionable business insights
      const leadScore = entry.leadScore || {};
      const contactInfo = entry.contactInfo || {};
      
      // Analyze the conversation for key insights
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

      console.log('Conversation logged to Google Sheets');
    } catch (error) {
      console.error('Failed to log conversation to Google Sheets:', error);
      // Don't throw error to avoid breaking the main conversation flow
    }
  }

  async logCallBooking(entry: CallBookingEntry): Promise<void> {
    try {
      if (!this.spreadsheetId) {
        console.warn('Google Sheets ID not configured, skipping booking log');
        return;
      }

      const authClient = await this.auth.getClient();
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      const values = [[
        new Date(entry.timestamp).toISOString(),
        entry.sessionId,
        entry.contactInfo?.name || '',
        entry.contactInfo?.email || '',
        entry.contactInfo?.phone || '',
        entry.contactInfo?.company || '',
        entry.contactInfo?.title || '',
        entry.bookingInfo?.date || '',
        entry.bookingInfo?.time || '',
        entry.bookingInfo?.type || '',
        entry.leadScore?.overall || 0,
        'call_booked',
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Bookings!A:L',
        valueInputOption: 'RAW',
        resource: { values },
      });

      console.log('Call booking logged to Google Sheets');
    } catch (error) {
      console.error('Failed to log call booking to Google Sheets:', error);
      // Don't throw error to avoid breaking the booking flow
    }
  }

  async initializeSheets(): Promise<void> {
    try {
      if (!this.spreadsheetId) {
        console.warn('Google Sheets ID not configured');
        return;
      }

      const authClient = await this.auth.getClient();
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      // First, try to create the worksheets if they don't exist
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: 'Conversations',
                  },
                },
              },
              {
                addSheet: {
                  properties: {
                    title: 'Bookings',
                  },
                },
              },
            ],
          },
        });
      } catch (error: any) {
        // Sheets might already exist, which is fine
        if (!error.message?.includes('already exists')) {
          console.log('Worksheets already exist or other issue:', error.message);
        }
      }

      // Create headers for Conversations sheet
      const conversationHeaders = [
        'Timestamp',
        'Session ID',
        'Lead Score (Overall)',
        'Budget Score',
        'Authority Score',
        'Need Score',
        'Timeline Score',
        'Customer Name',
        'Company',
        'Email',
        'Phone',
        'Job Title',
        'Pain Points',
        'Budget Range',
        'Decision Timeline',
        'Qualification Status',
        'Key Insights',
        'Next Actions',
        'Industry',
        'Company Size',
        'Lead Source',
      ];

      // Create headers for Bookings sheet
      const bookingHeaders = [
        'Timestamp',
        'Session ID',
        'Name',
        'Email',
        'Phone',
        'Company',
        'Title',
        'Date',
        'Time',
        'Type',
        'Lead Score',
        'Status',
      ];

      // Add headers to both sheets
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Conversations!A1:U1',
          valueInputOption: 'RAW',
          resource: { values: [conversationHeaders] },
        });

        await sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Bookings!A1:L1',
          valueInputOption: 'RAW',
          resource: { values: [bookingHeaders] },
        });

        console.log('Google Sheets initialized successfully');
      } catch (error: any) {
        console.error('Failed to add headers to sheets:', error.message);
      }
    } catch (error: any) {
      console.error('Failed to initialize Google Sheets:', error.message);
    }
  }

  // Helper methods for extracting business insights
  private extractPainPoints(userMessage: string, aiResponse: string): string {
    const painKeywords = ['problem', 'issue', 'challenge', 'struggle', 'difficult', 'pain', 'frustrat', 'concern', 'worry'];
    const combined = `${userMessage} ${aiResponse}`.toLowerCase();
    
    const foundPains = painKeywords.filter(keyword => combined.includes(keyword));
    if (foundPains.length === 0) return '';
    
    // Extract sentence containing pain points
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
      'manufacturing': ['manufacturing', 'factory', 'production'],
      'education': ['school', 'university', 'education', 'learning'],
      'real estate': ['real estate', 'property', 'realty'],
      'consulting': ['consulting', 'advisory', 'services'],
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
    
    // Look for employee count mentions
    const employeeMatch = combined.match(/(\d+)\s*(employees|people|staff)/);
    if (employeeMatch) {
      const count = parseInt(employeeMatch[1]);
      if (count <= 50) return 'Small (1-50)';
      if (count <= 200) return 'Medium (51-200)';
      return 'Large (200+)';
    }
    
    return '';
  }

  private extractKeyInsights(userMessage: string, aiResponse: string): string {
    const insights = [];
    const combined = `${userMessage} ${aiResponse}`.toLowerCase();
    
    if (combined.includes('competitor') || combined.includes('alternative')) {
      insights.push('Has alternatives in mind');
    }
    if (combined.includes('decision maker') || combined.includes('ceo') || combined.includes('owner')) {
      insights.push('Decision maker');
    }
    if (combined.includes('urgent') || combined.includes('asap')) {
      insights.push('Urgent need');
    }
    if (combined.includes('budget') || combined.includes('price') || combined.includes('cost')) {
      insights.push('Price conscious');
    }
    
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

export const sheetsService = new SheetsService();

// Initialize sheets on startup
sheetsService.initializeSheets().catch(console.error);
