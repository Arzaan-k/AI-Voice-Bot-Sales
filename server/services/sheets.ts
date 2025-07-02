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

      const values = [[
        new Date(entry.timestamp).toISOString(),
        entry.sessionId,
        entry.userMessage,
        entry.aiResponse,
        JSON.stringify(entry.leadScore),
        JSON.stringify(entry.contactInfo),
        entry.leadScore?.overall || 0,
        'conversation',
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Conversations!A:H',
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
        'User Message',
        'AI Response',
        'Lead Score JSON',
        'Contact Info JSON',
        'Lead Score',
        'Type',
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
          range: 'Conversations!A1:H1',
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
}

export const sheetsService = new SheetsService();

// Initialize sheets on startup
sheetsService.initializeSheets().catch(console.error);
