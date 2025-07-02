import { GoogleAuth } from 'google-auth-library';

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
    
    // Initialize Google Auth
    this.auth = new GoogleAuth({
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : undefined,
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
      const sheets = require('googleapis').google.sheets({ version: 'v4', auth: authClient });

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
      const sheets = require('googleapis').google.sheets({ version: 'v4', auth: authClient });

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
      const sheets = require('googleapis').google.sheets({ version: 'v4', auth: authClient });

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

      // Add headers if sheets don't exist
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
    } catch (error) {
      console.error('Failed to initialize Google Sheets:', error);
    }
  }
}

export const sheetsService = new SheetsService();

// Initialize sheets on startup
sheetsService.initializeSheets().catch(console.error);
