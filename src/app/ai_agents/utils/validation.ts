import { ZenProject, ZenUser, ZenTicket } from '../types/database';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return passwordRegex.test(password);
};

export const validateProject = (project: Partial<ZenProject>): string[] => {
  const errors: string[] = [];

  if (!project.name?.trim()) errors.push('Project name is required');
  if (!project.description?.trim()) errors.push('Project description is required');
  if (!project.status) errors.push('Project status is required');
  if (!project.priority) errors.push('Project priority is required');
  if (!project.category?.trim()) errors.push('Project category is required');
  if (!project.start_date) errors.push('Project start date is required');
  if (!project.end_date) errors.push('Project end date is required');
  
  // Validate dates
  if (project.start_date && project.end_date) {
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    if (end < start) errors.push('End date must be after start date');
  }

  return errors;
};

export const validateUser = (user: Partial<ZenUser>): string[] => {
  const errors: string[] = [];

  if (!user.email?.trim()) errors.push('Email is required');
  if (user.email && !validateEmail(user.email)) errors.push('Invalid email format');
  if (!user.name?.trim()) errors.push('Name is required');
  if (!user.role) errors.push('Role is required');
  if (!user.department?.trim()) errors.push('Department is required');
  if (!user.title?.trim()) errors.push('Title is required');

  return errors;
};

export const validateTicket = (ticket: Partial<ZenTicket>): string[] => {
  const errors: string[] = [];

  if (!ticket.title?.trim()) errors.push('Ticket title is required');
  if (!ticket.description?.trim()) errors.push('Ticket description is required');
  if (!ticket.status) errors.push('Ticket status is required');
  if (!ticket.priority) errors.push('Ticket priority is required');
  if (!ticket.category?.trim()) errors.push('Ticket category is required');
  if (!ticket.project_id) errors.push('Project ID is required');
  if (!ticket.created_by) errors.push('Creator is required');

  return errors;
};
