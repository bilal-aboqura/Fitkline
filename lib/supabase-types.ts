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
          notes?: string | null;
        };
        Update: {
          updated_at?: string;
          order_status?: string;
          payment_status?: string;
          kashier_session_id?: string | null;
          kashier_payment_id?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
