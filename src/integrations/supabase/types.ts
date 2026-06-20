export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          apartment: string | null
          building: string | null
          city: string
          created_at: string
          full_name: string
          governorate: string
          id: string
          is_default: boolean
          notes: string | null
          phone: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apartment?: string | null
          building?: string | null
          city: string
          created_at?: string
          full_name: string
          governorate: string
          id?: string
          is_default?: boolean
          notes?: string | null
          phone: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apartment?: string | null
          building?: string | null
          city?: string
          created_at?: string
          full_name?: string
          governorate?: string
          id?: string
          is_default?: boolean
          notes?: string | null
          phone?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          display_order: number
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name_ar: string
          name_en: string
          nav_order: number
          parent_id: string | null
          show_in_nav: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar: string
          name_en: string
          nav_order?: number
          parent_id?: string | null
          show_in_nav?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar?: string
          name_en?: string
          nav_order?: number
          parent_id?: string | null
          show_in_nav?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_subtotal: number
          starts_at: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_subtotal?: number
          starts_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_subtotal?: number
          starts_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      marketing_costs: {
        Row: {
          amount: number
          channel: string | null
          cost_date: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          channel?: string | null
          cost_date?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          channel?: string | null
          cost_date?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_cover: string | null
          product_id: string | null
          product_title_ar: string
          product_title_en: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_cover?: string | null
          product_id?: string | null
          product_title_ar: string
          product_title_en: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_cover?: string | null
          product_id?: string | null
          product_title_ar?: string
          product_title_en?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          discount: number
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: Json
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          discount?: number
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address: Json
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          discount?: number
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: Json
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          author_ar: string
          author_en: string
          category_id: string | null
          compare_at_price: number | null
          cost_price: number
          cover_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          images: Json
          is_active: boolean
          is_bestseller: boolean
          is_featured: boolean
          is_new_arrival: boolean
          isbn: string | null
          language: string | null
          marketing_cost: number
          misc_expenses: number
          pages: number | null
          price: number
          profit_margin: number | null
          publication_year: number | null
          publisher_ar: string | null
          publisher_en: string | null
          rating: number | null
          reviews_count: number
          slug: string
          stock: number
          title_ar: string
          title_en: string
          unlimited_stock: boolean
          updated_at: string
        }
        Insert: {
          author_ar: string
          author_en: string
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          images?: Json
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          isbn?: string | null
          language?: string | null
          marketing_cost?: number
          misc_expenses?: number
          pages?: number | null
          price: number
          profit_margin?: number | null
          publication_year?: number | null
          publisher_ar?: string | null
          publisher_en?: string | null
          rating?: number | null
          reviews_count?: number
          slug: string
          stock?: number
          title_ar: string
          title_en: string
          unlimited_stock?: boolean
          updated_at?: string
        }
        Update: {
          author_ar?: string
          author_en?: string
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          images?: Json
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          isbn?: string | null
          language?: string | null
          marketing_cost?: number
          misc_expenses?: number
          pages?: number | null
          price?: number
          profit_margin?: number | null
          publication_year?: number | null
          publisher_ar?: string | null
          publisher_en?: string | null
          rating?: number | null
          reviews_count?: number
          slug?: string
          stock?: number
          title_ar?: string
          title_en?: string
          unlimited_stock?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          enabled: boolean
          governorate_ar: string
          governorate_en: string
          id: number
          price: number
          updated_at: string | null
        }
        Insert: {
          enabled?: boolean
          governorate_ar: string
          governorate_en: string
          id?: never
          price?: number
          updated_at?: string | null
        }
        Update: {
          enabled?: boolean
          governorate_ar?: string
          governorate_en?: string
          id?: never
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_ar: string | null
          about_en: string | null
          contact_address_ar: string | null
          contact_address_en: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          custom_strings: Json
          favicon_url: string | null
          footer_about_ar: string | null
          footer_about_en: string | null
          hero_images: Json
          hero_subtitle_ar: string | null
          hero_subtitle_en: string | null
          hero_title_ar: string | null
          hero_title_en: string | null
          id: number
          logo_url: string | null
          meta_description_ar: string | null
          meta_description_en: string | null
          privacy_policy_ar: string | null
          privacy_policy_en: string | null
          refund_policy_ar: string | null
          refund_policy_en: string | null
          shipping_policy_ar: string | null
          shipping_policy_en: string | null
          site_name_ar: string | null
          site_name_en: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_tiktok: string | null
          social_twitter: string | null
          social_whatsapp: string | null
          social_youtube: string | null
          tagline_ar: string | null
          tagline_en: string | null
          terms_ar: string | null
          terms_en: string | null
          updated_at: string
        }
        Insert: {
          about_ar?: string | null
          about_en?: string | null
          contact_address_ar?: string | null
          contact_address_en?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_strings?: Json
          favicon_url?: string | null
          footer_about_ar?: string | null
          footer_about_en?: string | null
          hero_images?: Json
          hero_subtitle_ar?: string | null
          hero_subtitle_en?: string | null
          hero_title_ar?: string | null
          hero_title_en?: string | null
          id?: number
          logo_url?: string | null
          meta_description_ar?: string | null
          meta_description_en?: string | null
          privacy_policy_ar?: string | null
          privacy_policy_en?: string | null
          refund_policy_ar?: string | null
          refund_policy_en?: string | null
          shipping_policy_ar?: string | null
          shipping_policy_en?: string | null
          site_name_ar?: string | null
          site_name_en?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          social_whatsapp?: string | null
          social_youtube?: string | null
          tagline_ar?: string | null
          tagline_en?: string | null
          terms_ar?: string | null
          terms_en?: string | null
          updated_at?: string
        }
        Update: {
          about_ar?: string | null
          about_en?: string | null
          contact_address_ar?: string | null
          contact_address_en?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_strings?: Json
          favicon_url?: string | null
          footer_about_ar?: string | null
          footer_about_en?: string | null
          hero_images?: Json
          hero_subtitle_ar?: string | null
          hero_subtitle_en?: string | null
          hero_title_ar?: string | null
          hero_title_en?: string | null
          id?: number
          logo_url?: string | null
          meta_description_ar?: string | null
          meta_description_en?: string | null
          privacy_policy_ar?: string | null
          privacy_policy_en?: string | null
          refund_policy_ar?: string | null
          refund_policy_en?: string | null
          shipping_policy_ar?: string | null
          shipping_policy_en?: string | null
          site_name_ar?: string | null
          site_name_en?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          social_whatsapp?: string | null
          social_youtube?: string | null
          tagline_ar?: string | null
          tagline_en?: string | null
          terms_ar?: string | null
          terms_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_product_rating: {
        Args: { _product_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      coupon_type: "percent" | "fixed"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_method: "cod" | "paymob_card" | "paymob_wallet"
      payment_status: "pending" | "paid" | "failed" | "refunded"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "customer"],
      coupon_type: ["percent", "fixed"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_method: ["cod", "paymob_card", "paymob_wallet"],
      payment_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const
