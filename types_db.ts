export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      intake_logs: {
        Row: {
          checked_at: string | null;
          created_at: string;
          date: string;
          deleted_at: string | null;
          id: number;
          medicine_id: number;
          schedule_id: number;
          source: Database["public"]["Enums"]["intake_source"];
          status: Database["public"]["Enums"]["intake_status"];
          time: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          checked_at?: string | null;
          created_at?: string;
          date: string;
          deleted_at?: string | null;
          id?: number;
          medicine_id: number;
          schedule_id: number;
          source: Database["public"]["Enums"]["intake_source"];
          status?: Database["public"]["Enums"]["intake_status"];
          time: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          checked_at?: string | null;
          created_at?: string;
          date?: string;
          deleted_at?: string | null;
          id?: number;
          medicine_id?: number;
          schedule_id?: number;
          source?: Database["public"]["Enums"]["intake_source"];
          status?: Database["public"]["Enums"]["intake_status"];
          time?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "intake_logs_medicine_id_fkey";
            columns: ["medicine_id"];
            isOneToOne: false;
            referencedRelation: "medicines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "intake_logs_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "medicine_schedules";
            referencedColumns: ["id"];
          }
        ];
      };
      medicine_schedules: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: number;
          is_notify: boolean;
          medicine_id: number;
          repeated_pattern: Json;
          time: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_notify?: boolean;
          medicine_id: number;
          repeated_pattern: Json;
          time: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_notify?: boolean;
          medicine_id?: number;
          repeated_pattern?: Json;
          time?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medicine_schedules_medicine_id_fkey";
            columns: ["medicine_id"];
            isOneToOne: false;
            referencedRelation: "medicines";
            referencedColumns: ["id"];
          }
        ];
      };
      medicines: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string[] | null;
          id: number;
          image_url: string | null;
          is_active: boolean;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string[] | null;
          id?: number;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string[] | null;
          id?: number;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          nickname: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          nickname?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          nickname?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_future_logs_for_schedule: {
        Args: { p_schedule_id: number };
        Returns: undefined;
      };
      generate_logs_for_all_schedules: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      generate_logs_for_schedule: {
        Args: { p_from_date: string; p_schedule_id: number; p_to_date: string };
        Returns: undefined;
      };
      reset_future_logs_for_schedule: {
        Args: { p_schedule_id: number };
        Returns: undefined;
      };
    };
    Enums: {
      intake_source: "manual" | "auto";
      intake_status: "scheduled" | "taken" | "skipped" | "missed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      intake_source: ["manual", "auto"],
      intake_status: ["scheduled", "taken", "skipped", "missed"],
    },
  },
} as const;
