import { supabase } from './supabase';

export const notificationService = {
  // Get user's notifications
  async getUserNotifications(userId, filters = {}) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read);
    }
    
    query = query.order('created_at', { ascending: false });
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get unread notification count
  async getUnreadCount(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('notification_id')
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    return data?.length || 0;
  },

  // Create notification
  async createNotification(userId, type, title, content = '') {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        title: title,
        content: content
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('notification_id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mark all notifications as read
  async markAllAsRead(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Delete notification
  async deleteNotification(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('notification_id', notificationId);
    
    if (error) throw error;
  },

  // Delete all read notifications
  async deleteReadNotifications(userId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true);
    
    if (error) throw error;
  },

  // Send email notification
  async sendEmail(recipient, subject, body, attachments = []) {
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        recipient: recipient,
        subject: subject,
        body: body,
        attachments: attachments
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get email queue status
  async getEmailQueue() {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Update email status
  async updateEmailStatus(emailId, status) {
    const updateData = { status };
    
    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('email_queue')
      .update(updateData)
      .eq('email_id', emailId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get notification templates
  async getNotificationTemplates() {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // Get notification template by name
  async getNotificationTemplate(templateName) {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('template_name', templateName)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create notification template
  async createNotificationTemplate(templateName, subject, body, variables = []) {
    const { data, error } = await supabase
      .from('notification_templates')
      .insert({
        template_name: templateName,
        subject: subject,
        body: body,
        variables: variables
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update notification template
  async updateNotificationTemplate(templateName, updateData) {
    const { data, error } = await supabase
      .from('notification_templates')
      .update(updateData)
      .eq('template_name', templateName)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete notification template
  async deleteNotificationTemplate(templateName) {
    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('template_name', templateName);
    
    if (error) throw error;
  },

  // Render template with variables
  renderTemplate(template, variables) {
    let rendered = template;
    
    // Replace variables in the template
    variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      rendered = rendered.replace(regex, variables[variable] || '');
    });
    
    return rendered;
  },

  // Send booking confirmation
  async sendBookingConfirmation(userId, bookingId) {
    // Create in-app notification
    await this.createNotification(
      userId,
      'booking_confirmation',
      'Booking Confirmed',
      `Your booking ${bookingId} has been confirmed.`
    );
    
    // Send email confirmation
    const template = await this.getNotificationTemplate('booking_confirmation');
    if (template) {
      const user = await supabase
        .from('users')
        .select('email')
        .eq('user_id', userId)
        .single();
      
      if (user) {
        const subject = this.renderTemplate(template.subject, { booking_id: bookingId });
        const body = this.renderTemplate(template.body, { booking_id: bookingId });
        
        await this.sendEmail(user.email, subject, body);
      }
    }
  },

  // Send payment confirmation
  async sendPaymentConfirmation(userId, paymentId, amount) {
    await this.createNotification(
      userId,
      'payment_confirmation',
      'Payment Successful',
      `Your payment of $${amount} has been processed successfully.`
    );
  },

  // Send booking cancellation notice
  async sendBookingCancellation(userId, bookingId) {
    await this.createNotification(
      userId,
      'booking_cancellation',
      'Booking Cancelled',
      `Your booking ${bookingId} has been cancelled.`
    );
  },

  // Send welcome email
  async sendWelcomeEmail(userId, fullName) {
    const user = await supabase
      .from('users')
      .select('email')
      .eq('user_id', userId)
      .single();
    
    if (user) {
      await this.sendEmail(
        user.email,
        'Welcome to Patronus Travel!',
        `Welcome ${fullName}! Thank you for joining Patronus Travel. Your account has been successfully created.`
      );
    }
  },

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken) {
    await this.sendEmail(
      email,
      'Password Reset Request',
      `You requested to reset your password. Use this token: ${resetToken}`
    );
  },

  // Process email queue (admin only)
  async processEmailQueue() {
    const emails = await this.getEmailQueue();
    
    for (const email of emails) {
      try {
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mark as sent
        await this.updateEmailStatus(email.email_id, 'sent');
      } catch {
        // Mark as failed
        await this.updateEmailStatus(email.email_id, 'failed');
      }
    }
    
    return emails.length;
  },

  // Get notification statistics
  async getNotificationStats(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('type, is_read')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const stats = {
      total_notifications: data?.length || 0,
      unread_count: data?.filter(n => !n.is_read).length || 0,
      read_count: data?.filter(n => n.is_read).length || 0,
      by_type: {}
    };
    
    data?.forEach(notification => {
      stats.by_type[notification.type] = (stats.by_type[notification.type] || 0) + 1;
    });
    
    return stats;
  },

  // Get all notifications (admin only)
  async getAllNotifications(filters = {}) {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        users (user_id, email, full_name)
      `);
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get email queue statistics (admin only)
  async getEmailQueueStats() {
    const { data, error } = await supabase
      .from('email_queue')
      .select('status')
      .eq('status', 'pending');
    
    if (error) throw error;
    
    return {
      pending_emails: data?.length || 0,
      total_pending: data?.length || 0
    };
  }
};
