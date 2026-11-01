// Hand-written to match supabase/migrations/0001_init.sql. Once a live
// Supabase project exists, this can be regenerated with:
//   npx supabase gen types typescript --project-id <id> > src/lib/db/types.ts

export type RoomType = "triple" | "shared" | "single" | "studio";
export type ReminderMode = "auto" | "manual";
export type GovIdType = "nin_slip" | "international_passport" | "voters_card";
export type TenancyStatus = "active" | "notice" | "checked_out";
export type DepositOutcome = "refund" | "partial" | "kept";
export type PaymentMethod = "transfer" | "cash";
export type ChargeKind = "late_fee";
export type BroadcastScopeType = "portfolio" | "property" | "room" | "tenant";
export type BroadcastTemplate = "rent_increase" | "maintenance" | "house_rules" | "general" | "blank";
export type MessageTrigger = "auto" | "manual" | "broadcast";
export type MessageStatus = "ready" | "opened" | "marked_sent";

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          name: string;
          area: string;
          address: string;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          area: string;
          address: string;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          property_id: string;
          name: string;
          type: RoomType;
          rent_per_bed: number;
          reminder_mode: ReminderMode;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          name: string;
          type: RoomType;
          rent_per_bed: number;
          reminder_mode?: ReminderMode;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rooms"]["Insert"]>;
        Relationships: [];
      };
      beds: {
        Row: {
          id: string;
          room_id: string;
          label: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          label: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["beds"]["Insert"]>;
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          occupation: string;
          next_of_kin_name: string;
          next_of_kin_relation: string;
          next_of_kin_phone: string;
          emergency_contact: string;
          photo_url: string | null;
          licence_url: string | null;
          gov_id_type: GovIdType | null;
          gov_id_url: string | null;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email: string;
          occupation: string;
          next_of_kin_name: string;
          next_of_kin_relation: string;
          next_of_kin_phone: string;
          emergency_contact: string;
          photo_url?: string | null;
          licence_url?: string | null;
          gov_id_type?: GovIdType | null;
          gov_id_url?: string | null;
          verified?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      tenancies: {
        Row: {
          id: string;
          bed_id: string;
          tenant_id: string;
          move_in: string;
          rent: number;
          deposit: number;
          status: TenancyStatus;
          notice_reason: string | null;
          move_out: string | null;
          deposit_outcome: DepositOutcome | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bed_id: string;
          tenant_id: string;
          move_in: string;
          rent: number;
          deposit: number;
          status?: TenancyStatus;
          notice_reason?: string | null;
          move_out?: string | null;
          deposit_outcome?: DepositOutcome | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenancies"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          tenancy_id: string;
          period_month: string;
          amount: number;
          method: PaymentMethod;
          paid_at: string;
        };
        Insert: {
          id?: string;
          tenancy_id: string;
          period_month: string;
          amount: number;
          method: PaymentMethod;
          paid_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      charges: {
        Row: {
          id: string;
          tenancy_id: string;
          kind: ChargeKind;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenancy_id: string;
          kind: ChargeKind;
          amount: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["charges"]["Insert"]>;
        Relationships: [];
      };
      broadcasts: {
        Row: {
          id: string;
          scope_type: BroadcastScopeType;
          scope_id: string | null;
          template: BroadcastTemplate;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          scope_type: BroadcastScopeType;
          scope_id?: string | null;
          template: BroadcastTemplate;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["broadcasts"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          tenancy_id: string | null;
          broadcast_id: string | null;
          phone: string;
          template: string;
          body: string;
          trigger: MessageTrigger;
          status: MessageStatus;
          wa_link: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenancy_id?: string | null;
          broadcast_id?: string | null;
          phone: string;
          template: string;
          body: string;
          trigger: MessageTrigger;
          status?: MessageStatus;
          wa_link: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          tenancy_id: string | null;
          type: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenancy_id?: string | null;
          type: string;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
