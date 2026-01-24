// Supabase Database Types

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      app_state: {
        Row: {
          id: string;
          user_id: string;
          current_day: any;
          task_library: any;
          archive: any;
          active_day_session: any | null;
          active_task_timer: any | null;
          active_goal_plan: any | null;
          goal_plan_index: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_day: any;
          task_library: any;
          archive?: any;
          active_day_session?: any | null;
          active_task_timer?: any | null;
          active_goal_plan?: any | null;
          goal_plan_index?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          current_day?: any;
          task_library?: any;
          archive?: any;
          active_day_session?: any | null;
          active_task_timer?: any | null;
          active_goal_plan?: any | null;
          goal_plan_index?: any;
          updated_at?: string;
        };
      };
      goal_plans: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          data: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          data: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          data?: any;
          is_active?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type AppStateRow = Database['public']['Tables']['app_state']['Row'];
export type GoalPlanRow = Database['public']['Tables']['goal_plans']['Row'];
