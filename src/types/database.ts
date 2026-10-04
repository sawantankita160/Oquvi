/**
 * Oquvi - Supabase PostgreSQL Database Type Definitions
 * 
 * Auto-generated and maintained TypeScript representations of the 7 core Oquvi tables.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectMemberRole = 'owner' | 'member';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          deadline: string | null;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          deadline?: string | null;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          deadline?: string | null;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: ProjectMemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: ProjectMemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: ProjectMemberRole;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          assigned_user_id: string | null;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: PriorityLevel;
          deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          assigned_user_id?: string | null;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: PriorityLevel;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          assigned_user_id?: string | null;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: PriorityLevel;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          comment: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          task_id: string | null;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          task_id?: string | null;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          task_id?: string | null;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          action: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          action: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string | null;
          action?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_project_owner: {
        Args: { p_id: string; u_id: string };
        Returns: boolean;
      };
      is_project_member: {
        Args: { p_id: string; u_id: string };
        Returns: boolean;
      };
      can_access_project: {
        Args: { p_id: string; u_id: string };
        Returns: boolean;
      };
      can_access_task: {
        Args: { t_id: string; u_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      project_member_role: ProjectMemberRole;
      task_status: TaskStatus;
      priority_level: PriorityLevel;
    };
  };
}
