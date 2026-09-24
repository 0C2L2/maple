export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          attendance_band: string
          audience_types: string[]
          categories: string[]
          city: string | null
          country: string | null
          created_at: string
          created_by: string
          description: string | null
          ends_at: string
          format: Database["public"]["Enums"]["event_format"]
          id: string
          org_id: string
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          timezone: string
          title: string
          updated_at: string
          venue_name: string | null
          website: string | null
        }
        Insert: {
          attendance_band: string
          audience_types: string[]
          categories: string[]
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at: string
          format: Database["public"]["Enums"]["event_format"]
          id?: string
          org_id: string
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone: string
          title: string
          updated_at?: string
          venue_name?: string | null
          website?: string | null
        }
        Update: {
          attendance_band?: string
          audience_types?: string[]
          categories?: string[]
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string
          format?: Database["public"]["Enums"]["event_format"]
          id?: string
          org_id?: string
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          title?: string
          updated_at?: string
          venue_name?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          org_id: string
          profile_id: string
          role: Database["public"]["Enums"]["organization_member_role"]
          verified_email: boolean
        }
        Insert: {
          created_at?: string
          org_id: string
          profile_id: string
          role: Database["public"]["Enums"]["organization_member_role"]
          verified_email?: boolean
        }
        Update: {
          created_at?: string
          org_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["organization_member_role"]
          verified_email?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          about: string | null
          cover_url: string | null
          created_at: string
          created_by: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          about?: string | null
          cover_url?: string | null
          created_at?: string
          created_by: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          type: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          about?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          audience_band: string | null
          audience_types: string[]
          bio: string | null
          categories: string[]
          completeness: number
          created_at: string
          gives: string[]
          handle: string
          headline: string | null
          id: string
          location: string | null
          name: string
          photo_url: string | null
          regions: string[]
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
        }
        Insert: {
          audience_band?: string | null
          audience_types?: string[]
          bio?: string | null
          categories?: string[]
          completeness?: number
          created_at?: string
          gives?: string[]
          handle: string
          headline?: string | null
          id: string
          location?: string | null
          name: string
          photo_url?: string | null
          regions?: string[]
          role: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Update: {
          audience_band?: string | null
          audience_types?: string[]
          bio?: string | null
          categories?: string[]
          completeness?: number
          created_at?: string
          gives?: string[]
          handle?: string
          headline?: string | null
          id?: string
          location?: string | null
          name?: string
          photo_url?: string | null
          regions?: string[]
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_format: "in_person" | "online" | "hybrid"
      event_status: "draft" | "published"
      organization_member_role: "admin" | "member"
      organization_type:
        | "event_company"
        | "brand"
        | "agency"
        | "university_club"
      profile_role: "organizer" | "sponsor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_format: ["in_person", "online", "hybrid"],
      event_status: ["draft", "published"],
      organization_member_role: ["admin", "member"],
      organization_type: [
        "event_company",
        "brand",
        "agency",
        "university_club",
      ],
      profile_role: ["organizer", "sponsor"],
    },
  },
} as const

