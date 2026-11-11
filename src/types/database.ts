/**
 * Tipos del esquema de PostgreSQL (supabase/migrations).
 * Mantener sincronizado con las migraciones. Con Supabase CLI se puede regenerar:
 *   supabase gen types typescript --linked > src/types/database.ts
 */

export type UserRole = 'admin' | 'operador'
export type MovementType = 'entrada' | 'salida' | 'ajuste' | 'venta' | 'cancelacion' | 'devolucion'
export type SaleStatus = 'completada' | 'anulada'
export type PaymentMethod = 'efectivo' | 'transferencia' | 'nequi' | 'daviplata' | 'tarjeta' | 'otro'

export type StockStatus = 'disponible' | 'bajo' | 'agotado'

export type DashboardSummary = {
  total_products: number
  available_products: number
  out_of_stock_products: number
  low_stock_products: number
  inactive_products: number
  sales_today_count: number
  sales_today_revenue: number
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: never
        Update: {
          full_name?: string
          role?: UserRole
          is_active?: boolean
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          sku: string | null
          name: string
          description: string | null
          category_id: string
          price: number
          stock: number
          min_stock: number | null
          is_active: boolean
          is_published: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          sku?: string | null
          name: string
          description?: string | null
          category_id: string
          price: number
          min_stock?: number | null
          is_active?: boolean
          is_published?: boolean
        }
        Update: {
          sku?: string | null
          name?: string
          description?: string | null
          category_id?: string
          price?: number
          min_stock?: number | null
          is_active?: boolean
          is_published?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      product_costs: {
        Row: {
          product_id: string
          cost: number
          updated_at: string
        }
        Insert: {
          product_id: string
          cost: number
        }
        Update: {
          cost?: number
        }
        Relationships: [
          {
            foreignKeyName: 'product_costs_product_id_fkey'
            columns: ['product_id']
            isOneToOne: true
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          storage_path: string
          position: number
          created_at: string
        }
        Insert: {
          product_id: string
          storage_path: string
          position?: number
        }
        Update: {
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      sales: {
        Row: {
          id: string
          sale_number: number
          status: SaleStatus
          payment_method: PaymentMethod
          total: number
          notes: string | null
          created_by: string
          created_at: string
          cancelled_at: string | null
          cancelled_by: string | null
          cancel_reason: string | null
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: 'sales_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          product_name: string
          unit_price: number
          quantity: number
          subtotal: number
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: 'sale_items_sale_id_fkey'
            columns: ['sale_id']
            isOneToOne: false
            referencedRelation: 'sales'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      inventory_movements: {
        Row: {
          id: string
          product_id: string
          type: MovementType
          quantity: number
          stock_before: number
          stock_after: number
          reason: string | null
          sale_id: string | null
          created_by: string
          created_at: string
        }
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: 'inventory_movements_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inventory_movements_sale_id_fkey'
            columns: ['sale_id']
            isOneToOne: false
            referencedRelation: 'sales'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inventory_movements_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      business_settings: {
        Row: {
          id: boolean
          business_name: string
          nit: string | null
          phone: string | null
          address: string | null
          email: string | null
          low_stock_threshold: number
          updated_at: string
        }
        Insert: never
        Update: {
          business_name?: string
          nit?: string | null
          phone?: string | null
          address?: string | null
          email?: string | null
          low_stock_threshold?: number
        }
        Relationships: []
      }
    }
    Views: {
      product_list: {
        Row: {
          id: string
          sku: string | null
          name: string
          description: string | null
          category_id: string
          category_name: string
          price: number
          stock: number
          min_stock: number | null
          effective_min_stock: number
          stock_status: StockStatus
          is_active: boolean
          is_published: boolean
          created_at: string
          updated_at: string
          main_image_path: string | null
          search_text: string
        }
        Relationships: []
      }
    }
    Functions: {
      get_dashboard_summary: { Args: Record<never, never>; Returns: DashboardSummary }
      is_active_user: { Args: Record<never, never>; Returns: boolean }
      is_admin: { Args: Record<never, never>; Returns: boolean }
    }
    Enums: {
      user_role: UserRole
      movement_type: MovementType
      sale_status: SaleStatus
      payment_method: PaymentMethod
    }
    CompositeTypes: Record<never, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
