/**
 * TypeScript type definitions for ElevenLabs ConvAI integration
 */

export interface ElevenLabsConvAIMessage {
  type: 'elevenlabs-convai-navigation' | 'elevenlabs-convai-command';
  command: string;
  params?: Record<string, any>;
}

export interface NavigationTool {
  (): string | void;
}

export interface NavigationTools {
  [key: string]: NavigationTool;
}

declare global {
  interface Window {
    convaiNavigationTools?: NavigationTools;
  }
}

export type VoiceCommand =
  // Page navigation
  | 'open_dashboard'
  | 'show_whatsapp_reports'
  | 'show_productivity_reports'
  | 'show_ads_reports'
  | 'show_mail_reports'
  | 'open_admin_settings'
  | 'open_bots'
  | 'show_social_posts'
  | 'show_content_ideas'
  | 'show_courses_prices'
  | 'go_home'
  // Browser controls
  | 'go_back'
  | 'go_forward'
  | 'refresh_page'
  // UI controls
  | 'toggle_sidebar'
  | 'open_sidebar'
  | 'close_sidebar'
  // Authentication
  | 'sign_out'
  | 'logout';
