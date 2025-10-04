import { addDays, format, parseISO } from 'date-fns';

export interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  meetingUrl?: string;
}

export interface GoogleCalendarConfig {
  clientId: string;
  apiKey: string;
  discoveryDocs: string[];
  scopes: string;
}

// Google Calendar integration
export class GoogleCalendarService {
  private gapi: any = null;
  private isInitialized = false;

  constructor(private config: GoogleCalendarConfig) {}

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    // Check if required environment variables are available
    if (!this.config.clientId || !this.config.apiKey) {
      console.warn('Google Calendar configuration missing. Calendar features will be disabled.');
      return false;
    }

    try {
      // Load Google API script
      await this.loadGoogleAPI();
      
      // Initialize gapi
      await new Promise((resolve, reject) => {
        (window as any).gapi.load('client:auth2', {
          callback: resolve,
          onerror: reject
        });
      });

      await (window as any).gapi.client.init({
        apiKey: this.config.apiKey,
        clientId: this.config.clientId,
        discoveryDocs: this.config.discoveryDocs,
        scope: this.config.scopes
      });

      this.gapi = (window as any).gapi;
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Calendar:', error);
      return false;
    }
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      return user.isSignedIn();
    } catch (error) {
      console.error('Google Calendar sign-in failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    } catch (error) {
      console.error('Google Calendar sign-out failed:', error);
    }
  }

  async isSignedIn(): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      return authInstance.isSignedIn.get();
    } catch (error) {
      console.error('Error checking sign-in status:', error);
      return false;
    }
  }

  async createEvent(event: CalendarEvent): Promise<string | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    const isSignedIn = await this.isSignedIn();
    if (!isSignedIn) {
      const signedIn = await this.signIn();
      if (!signedIn) return null;
    }

    try {
      const calendarEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        ...(event.location && { location: event.location }),
        ...(event.attendees && {
          attendees: event.attendees.map(email => ({ email }))
        }),
        ...(event.meetingUrl && {
          conferenceData: {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: {
                type: 'hangoutsMeet'
              }
            }
          }
        }),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 10 }, // 10 minutes before
          ],
        },
      };

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
        conferenceDataVersion: event.meetingUrl ? 1 : 0,
      });

      return response.result.id;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      return null;
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      const calendarEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        ...(event.location && { location: event.location }),
        ...(event.attendees && {
          attendees: event.attendees.map(email => ({ email }))
        }),
      };

      await this.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: calendarEvent,
      });

      return true;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await this.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });

      return true;
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      return false;
    }
  }
}

// Utility functions for calendar integration
export const generateMeetingUrl = (bookingId: string, providerName: string): string => {
  const roomName = `TimeShare-${bookingId}`;
  return `https://meet.google.com/${roomName}`;
};

export const generateJitsiUrl = (bookingId: string): string => {
  const roomName = `TimeShare-${bookingId}`;
  return `https://meet.jit.si/${roomName}`;
};

export const createCalendarEventFromBooking = (
  booking: any,
  skillTitle: string,
  providerName: string,
  requesterName: string
): CalendarEvent => {
  const startTime = new Date(booking.date);
  const [time, period] = booking.time.split(' ');
  const [hours, minutes] = time.split(':');
  let hour24 = parseInt(hours);
  
  if (period === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  startTime.setHours(hour24, parseInt(minutes), 0, 0);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

  return {
    title: `TimeShare Session: ${skillTitle}`,
    description: `Skill exchange session with ${providerName}.\n\nSession Details:\n- Skill: ${skillTitle}\n- Provider: ${providerName}\n- Requester: ${requesterName}\n- Duration: 1 hour\n- Credits: ${booking.credits}`,
    startTime,
    endTime,
    location: 'Online Session',
    attendees: [booking.requesterEmail, booking.providerEmail].filter(Boolean),
    meetingUrl: generateMeetingUrl(booking.id, providerName)
  };
};

// Default Google Calendar configuration
export const defaultGoogleCalendarConfig: GoogleCalendarConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  scopes: 'https://www.googleapis.com/auth/calendar'
};
