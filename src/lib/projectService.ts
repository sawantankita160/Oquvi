import { supabase } from './supabase';
import type { Database, ProjectMemberRole } from '../types/database';

export type DbProject = Database['public']['Tables']['projects']['Row'];
export type DbProjectMember = Database['public']['Tables']['project_members']['Row'];
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbActivityLog = Database['public']['Tables']['activity_logs']['Row'];

export interface ProjectMemberWithProfile {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export interface ProjectWithDetails {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  deadline: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  members: ProjectMemberWithProfile[];
  tasksCount: {
    total: number;
    completed: number;
  };
  progress: number;
}

/**
 * Fetch all projects accessible to the authenticated user.
 * Relies on Supabase RLS: only returns projects the user owns or is a member of.
 */
export async function fetchProjects(): Promise<{ data: ProjectWithDetails[] | null; error: string | null }> {
  try {
    // 1. Fetch projects with project_members and nested profiles
    const { data: rawProjects, error: projErr } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        owner_id,
        deadline,
        archived,
        created_at,
        updated_at,
        project_members (
          id,
          project_id,
          user_id,
          role,
          created_at,
          profiles (
            id,
            full_name,
            avatar_url
          )
        ),
        tasks (
          id,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (projErr) {
      return { data: null, error: projErr.message };
    }

    if (!rawProjects) {
      return { data: [], error: null };
    }

    // 2. Format nested data and calculate task progress
    const projects: ProjectWithDetails[] = rawProjects.map((p) => {
      const rawMembers = (p.project_members as unknown as Array<{
        id: string;
        project_id: string;
        user_id: string;
        role: ProjectMemberRole;
        created_at: string;
        profiles: { id: string; full_name: string; avatar_url: string | null } | null;
      }>) || [];

      const members: ProjectMemberWithProfile[] = rawMembers.map((m) => ({
        id: m.id,
        project_id: m.project_id,
        user_id: m.user_id,
        role: m.role,
        created_at: m.created_at,
        profile: m.profiles || null
      }));

      const rawTasks = (p.tasks as unknown as Array<{ id: string; status: string }>) || [];
      const totalTasks = rawTasks.length;
      const completedTasks = rawTasks.filter((t) => t.status === 'completed').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        owner_id: p.owner_id,
        deadline: p.deadline,
        archived: p.archived,
        created_at: p.created_at,
        updated_at: p.updated_at,
        members,
        tasksCount: {
          total: totalTasks,
          completed: completedTasks
        },
        progress
      };
    });

    return { data: projects, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch projects.' };
  }
}

/**
 * Fetch a single project by ID with members and task counts.
 */
export async function fetchProjectById(projectId: string): Promise<{ data: ProjectWithDetails | null; error: string | null }> {
  try {
    const { data: p, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        owner_id,
        deadline,
        archived,
        created_at,
        updated_at,
        project_members (
          id,
          project_id,
          user_id,
          role,
          created_at,
          profiles (
            id,
            full_name,
            avatar_url
          )
        ),
        tasks (
          id,
          status
        )
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!p) {
      return { data: null, error: 'Project not found.' };
    }

    const rawMembers = (p.project_members as unknown as Array<{
      id: string;
      project_id: string;
      user_id: string;
      role: ProjectMemberRole;
      created_at: string;
      profiles: { id: string; full_name: string; avatar_url: string | null } | null;
    }>) || [];

    const members: ProjectMemberWithProfile[] = rawMembers.map((m) => ({
      id: m.id,
      project_id: m.project_id,
      user_id: m.user_id,
      role: m.role,
      created_at: m.created_at,
      profile: m.profiles || null
    }));

    const rawTasks = (p.tasks as unknown as Array<{ id: string; status: string }>) || [];
    const totalTasks = rawTasks.length;
    const completedTasks = rawTasks.filter((t) => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const project: ProjectWithDetails = {
      id: p.id,
      name: p.name,
      description: p.description,
      owner_id: p.owner_id,
      deadline: p.deadline,
      archived: p.archived,
      created_at: p.created_at,
      updated_at: p.updated_at,
      members,
      tasksCount: {
        total: totalTasks,
        completed: completedTasks
      },
      progress
    };

    return { data: project, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch project.' };
  }
}

/**
 * Create a new project.
 * Uses authenticated user ID from Supabase auth session.
 * Database trigger automatically creates the 'owner' member record in project_members.
 */
export async function createProject(params: {
  name: string;
  description?: string;
  deadline?: string | null;
  userId: string;
}): Promise<{ data: DbProject | null; error: string | null }> {
  try {
    const trimmedName = params.name.trim();
    if (!trimmedName) {
      return { data: null, error: 'Project title cannot be empty.' };
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: trimmedName,
        description: params.description?.trim() || null,
        deadline: params.deadline || null,
        owner_id: params.userId,
        archived: false
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Log the activity
    await logActivity({
      projectId: data.id,
      userId: params.userId,
      action: `Created project "${trimmedName}"`
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create project.' };
  }
}

/**
 * Update an existing project's details (name, description, deadline).
 * Protected by RLS: only project owner can update.
 */
export async function updateProject(
  projectId: string,
  params: {
    name?: string;
    description?: string | null;
    deadline?: string | null;
  }
): Promise<{ data: DbProject | null; error: string | null }> {
  try {
    const updates: {
      name?: string;
      description?: string | null;
      deadline?: string | null;
    } = {};

    if (params.name !== undefined) {
      const trimmed = params.name.trim();
      if (!trimmed) {
        return { data: null, error: 'Project name cannot be empty.' };
      }
      updates.name = trimmed;
    }

    if (params.description !== undefined) {
      updates.description = params.description?.trim() || null;
    }

    if (params.deadline !== undefined) {
      updates.deadline = params.deadline || null;
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update project.' };
  }
}

/**
 * Toggle the archived state of a project.
 * Protected by RLS: only project owner can modify.
 */
export async function toggleArchiveProject(
  projectId: string,
  currentArchived: boolean,
  userId?: string
): Promise<{ data: DbProject | null; error: string | null }> {
  try {
    const nextArchived = !currentArchived;
    const { data, error } = await supabase
      .from('projects')
      .update({ archived: nextArchived })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (userId) {
      await logActivity({
        projectId,
        userId,
        action: nextArchived ? `Archived project "${data.name}"` : `Restored project "${data.name}" from archive`
      });
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to change archive status.' };
  }
}

/**
 * Delete a project.
 * Protected by RLS: only project owner can delete.
 */
export async function deleteProject(projectId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete project.' };
  }
}

/**
 * Add a member to a project.
 * Protected by RLS: only project owner can insert into project_members.
 */
export async function addProjectMember(
  projectId: string,
  targetUserId: string,
  role: ProjectMemberRole = 'member',
  currentUserId?: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: targetUserId,
        role
      });

    if (error) {
      if (error.code === '23505') {
        return { error: 'This user is already a member of this project.' };
      }
      return { error: error.message };
    }

    if (currentUserId) {
      await logActivity({
        projectId,
        userId: currentUserId,
        action: 'Added a new member to the project'
      });
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to add project member.' };
  }
}

/**
 * Remove a member from a project.
 * Protected by RLS: project owners can remove members, or members can leave themselves.
 */
export async function removeProjectMember(
  projectId: string,
  targetUserId: string,
  currentUserId?: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', targetUserId);

    if (error) {
      return { error: error.message };
    }

    if (currentUserId) {
      await logActivity({
        projectId,
        userId: currentUserId,
        action: 'Removed a member from the project'
      });
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to remove member.' };
  }
}

/**
 * Fetch all registered user profiles.
 * Used for searching and inviting collaborators into workspaces.
 */
export async function fetchProfiles(): Promise<{ data: DbProfile[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at, updated_at')
      .order('full_name', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch profiles.' };
  }
}

/**
 * Helper to record activity log entries.
 */
export async function logActivity(params: {
  projectId: string;
  userId?: string | null;
  action: string;
}): Promise<void> {
  try {
    await supabase.from('activity_logs').insert({
      project_id: params.projectId,
      user_id: params.userId || null,
      action: params.action
    });
  } catch {
    // Activity logging should never throw or break main operations
  }
}

/**
 * Fetch recent activity logs across accessible projects.
 */
export async function fetchActivityLogs(limit = 10): Promise<{
  data: Array<{
    id: string;
    action: string;
    created_at: string;
    user: {
      name: string;
      avatarUrl?: string;
    } | null;
  }> | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        action,
        created_at,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) return { data: [], error: null };

    const formatted = data.map((item) => {
      const prof = item.profiles as unknown as { full_name: string; avatar_url: string | null } | null;
      return {
        id: item.id,
        action: item.action,
        created_at: item.created_at,
        user: prof
          ? {
              name: prof.full_name,
              avatarUrl: prof.avatar_url || undefined
            }
          : null
      };
    });

    return { data: formatted, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch activity logs.' };
  }
}
