# VoiceBot Sales Assistant

## Overview

This is a voice-enabled AI sales bot application designed to handle 100+ sales calls per week with minimal latency. The system combines real-time speech processing, AI-powered conversation management, and automated data logging to create a complete sales qualification and booking platform.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript in client-side rendering mode
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React hooks with TanStack React Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **API Design**: RESTful endpoints with JSON communication
- **Development**: Vite for build tooling and hot module replacement
- **Module System**: ES modules throughout the stack

### Voice Processing
- **Speech Recognition**: Web Speech API (browser-native, zero cost)
- **Text-to-Speech**: Browser-native synthesis APIs
- **Real-time Processing**: Custom voice interface with session management

## Key Components

### 1. Voice Interface (`VoiceInterface`)
- Real-time speech-to-text conversion
- Automatic speech synthesis for AI responses
- Voice activity detection and session management
- Error handling and fallback mechanisms

### 2. Conversation Management (`ConversationDisplay`)
- Live conversation display with message threading
- Quick response buttons for common interactions
- Auto-scrolling message history
- Processing state indicators

### 3. Lead Qualification System (`LeadQualification`)
- BANT framework implementation (Budget, Authority, Need, Timeline)
- Real-time scoring from 0-10 for each criterion
- Visual progress indicators and qualification status
- Overall lead score calculation

### 4. Contact Information Collection (`ContactForm`)
- Dynamic form for capturing prospect details
- Email validation and phone number formatting
- Company and title information extraction
- Integration with conversation flow

### 5. Call Booking System (`CallBooking`)
- Calendar integration for appointment scheduling
- Meeting type selection (video/phone)
- Automated confirmation and calendar invitations
- Booking validation and error handling

## Data Flow

1. **Voice Input**: User speaks → Web Speech API converts to text
2. **AI Processing**: Text sent to `/api/chat` → Gemini AI generates response
3. **Response Generation**: AI response converted to speech → played to user
4. **Data Logging**: All interactions logged to Google Sheets
5. **Lead Scoring**: Real-time BANT qualification updates
6. **Call Booking**: Qualified leads routed to booking system

## External Dependencies

### AI Services
- **Google Gemini AI**: Primary conversation AI using `@google/genai`
- **Model**: Gemini 2.5 Flash for fast response times
- **Configuration**: JSON response format with structured lead scoring

### Database & Storage
- **Primary**: Drizzle ORM with PostgreSQL (via Neon Database)
- **Backup**: In-memory storage for development
- **External Logging**: Google Sheets API for conversation logging

### Voice APIs
- **Speech Recognition**: Web Speech API (browser-native)
- **Text-to-Speech**: SpeechSynthesis API (browser-native)
- **Session Management**: Custom session handling with unique IDs

## Deployment Strategy

### Development Environment
- **Local Server**: Express.js with Vite middleware
- **Hot Reloading**: Vite HMR for rapid development
- **Database**: Local PostgreSQL or in-memory fallback

### Production Deployment
- **Build Process**: Vite build for frontend, esbuild for backend
- **Hosting**: Designed for Vercel/Netlify deployment
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: Secure API key management

### Performance Optimizations
- **Response Time**: Target <2 seconds for AI responses
- **Concurrent Handling**: Session-based conversation management
- **Caching**: Query client caching for repeated requests
- **Error Recovery**: Graceful fallbacks for API failures

## Changelog

```
Changelog:
- July 02, 2025. Initial setup with Gemini AI integration
- July 02, 2025. Switched from Groq to Google Gemini 2.5 Flash model for free AI processing
- July 02, 2025. Enabled Google Sheets logging integration for conversation tracking
- July 02, 2025. Enhanced Google Sheets with smart business intelligence analytics
- July 02, 2025. Created Netlify deployment configuration for production
- July 02, 2025. Added full conversation transcript logging to Google Sheets
- July 02, 2025. Complete voice AI sales bot ready for production deployment
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```