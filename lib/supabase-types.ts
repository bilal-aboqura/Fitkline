export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      fitkline_cms_documents: {
        Row: {
          id: string;
          content: unknown;
          revision: number;
          updated_at: string;
        };
        Insert: {
          id: string;
          content: unknown;
          revision?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: unknown;
          revision?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      fitkline_governorates: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          shipping_price: number | string | null;
          active: boolean;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          id: string;
          name_ar?: string;
          name_en?: string;
          shipping_price?: number | null;
          active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          name_en?: string;
          shipping_price?: number | null;
          active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      fitkline_cities: {
        Row: {
          id: number;
          governorate_id: string;
          name_ar: string;
          name_en: string;
          shipping_price: number | string | null;
          active: boolean;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          governorate_id?: string;
          name_ar?: string;
          name_en?: string;
          shipping_price?: number | null;
          active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          governorate_id?: string;
          name_ar?: string;
          name_en?: string;
          shipping_price?: number | null;
          active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      fitkline_orders: {
        Row: {
          id: string;
          reference: string;
          created_at: string;
          updated_at: string;
          customer: unknown;
          items: unknown;
          subtotal: number | string | null;
          shipping_amount: number | string | null;
          total: number | string | null;
          currency: "EGP";
          order_status: string;
          payment_method: string;
          payment_status: string;
          kashier_session_id: string | null;
          kashier_payment_id: string | null;
          bosta: unknown | null;
          notes: string | null;
        };
        Insert: {
          id: string;
          reference: string;
          created_at: string;
          updated_at: string;
          customer: unknown;
          items: unknown;
          subtotal?: number | null;
          shipping_amount?: number | null;
          total?: number | null;
          currency?: "EGP";
          order_status: string;
          payment_method: string;
          payment_status: string;
          kashier_session_id?: string | null;
          kashier_payment_id?: string | null;
          bosta?: unknown | null;
          notes?: string | null;
        };
        Update: {
          updated_at?: string;
          order_status?: string;
          payment_status?: string;
          kashier_session_id?: string | null;
          kashier_payment_id?: string | null;
          bosta?: unknown | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      fitkline_bosta_pickups: {
        Row: {
          automation_key: string;
          bosta_pickup_id: string | null;
          puid: string | null;
          scheduled_date: string | null;
          scheduled_time_slot: string | null;
          state: string | null;
          business_location_id: string | null;
          order_references: unknown;
          tracking_numbers: unknown;
          parcel_count: number;
          telegram_sent: boolean;
          status: string;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          automation_key: string;
          bosta_pickup_id?: string | null;
          puid?: string | null;
          scheduled_date?: string | null;
          scheduled_time_slot?: string | null;
          state?: string | null;
          business_location_id?: string | null;
          order_references?: unknown;
          tracking_numbers?: unknown;
          parcel_count?: number;
          telegram_sent?: boolean;
          status: string;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bosta_pickup_id?: string | null;
          puid?: string | null;
          scheduled_date?: string | null;
          scheduled_time_slot?: string | null;
          state?: string | null;
          business_location_id?: string | null;
          order_references?: unknown;
          tracking_numbers?: unknown;
          parcel_count?: number;
          telegram_sent?: boolean;
          status?: string;
          error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      fitkline_analytics_events: {
        Row: {
          id: number;
          occurred_at: string;
          visitor_id: string;
          session_id: string;
          path: string;
          referrer_host: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          device_category: "desktop" | "mobile" | "tablet";
        };
        Insert: {
          id?: number;
          occurred_at?: string;
          visitor_id: string;
          session_id: string;
          path: string;
          referrer_host?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          device_category?: "desktop" | "mobile" | "tablet";
        };
        Update: {
          occurred_at?: string;
          visitor_id?: string;
          session_id?: string;
          path?: string;
          referrer_host?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          device_category?: "desktop" | "mobile" | "tablet";
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      fitkline_get_analytics: {
        Args: { p_days?: number };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
