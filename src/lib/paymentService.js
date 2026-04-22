import { supabase } from './supabase';

export const paymentService = {
  // Create payment
  async createPayment(paymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's payments
  async getUserPayments(userId, filters = {}) {
    let query = supabase
      .from('payments')
      .select(`
        *,
        invoices (*),
        refunds (*)
      `)
      .eq('user_id', userId);
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.payment_method) {
      query = query.eq('payment_method', filters.payment_method);
    }
    if (filters.start_date) {
      query = query.gte('paid_at', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('paid_at', filters.end_date);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single payment with details
  async getPaymentDetails(paymentId) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoices (*),
        refunds (*),
        bookings (
          booking_id,
          booking_type,
          total_price,
          status
        )
      `)
      .eq('payment_id', paymentId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update payment status
  async updatePaymentStatus(paymentId, status, transactionId = null) {
    const updateData = { status };
    
    if (status === 'completed') {
      updateData.paid_at = new Date().toISOString();
    }
    if (status === 'refunded') {
      updateData.refunded_at = new Date().toISOString();
    }
    if (transactionId) {
      updateData.transaction_id = transactionId;
    }
    
    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('payment_id', paymentId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Generate invoice for completed payments
    if (status === 'completed') {
      await this.generateInvoice(data.payment_id);
    }
    
    return data;
  },

  // Complete payment
  async completePayment(paymentId, transactionId) {
    return this.updatePaymentStatus(paymentId, 'completed', transactionId);
  },

  // Fail payment
  async failPayment(paymentId) {
    return this.updatePaymentStatus(paymentId, 'failed');
  },

  // Refund payment
  async refundPayment(paymentId, amount, reason = '') {
    // Update payment status
    const payment = await this.updatePaymentStatus(paymentId, 'refunded');
    
    // Create refund record
    const { data, error } = await supabase
      .from('refunds')
      .insert({
        payment_id: paymentId,
        amount: amount,
        reason: reason
      })
      .select()
      .single();
    
    if (error) throw error;
    return { payment, refund: data };
  },

  // Generate invoice
  async generateInvoice(paymentId) {
    const { error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', paymentId)
      .single();
    
    if (paymentError) throw paymentError;
    
    const invoiceNumber = this.generateInvoiceNumber();
    
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        payment_id: paymentId,
        invoice_number: invoiceNumber
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's saved payment methods
  async getUserPaymentMethods(userId) {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Add payment method
  async addPaymentMethod(userId, methodType, details, isDefault = false) {
    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);
    }
    
    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: userId,
        method_type: methodType,
        details: details,
        is_default: isDefault
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update payment method
  async updatePaymentMethod(methodId, updateData) {
    const { data, error } = await supabase
      .from('payment_methods')
      .update(updateData)
      .eq('method_id', methodId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Set default payment method
  async setDefaultPaymentMethod(userId, methodId) {
    // Unset all other defaults
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId)
      .neq('method_id', methodId);
    
    // Set new default
    const { data, error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('method_id', methodId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete payment method
  async deletePaymentMethod(methodId) {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('method_id', methodId);
    
    if (error) throw error;
  },

  // Get payment statistics
  async getUserPaymentStats(userId) {
    const { data, error } = await supabase
      .from('payments')
      .select('status, amount, payment_method')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const stats = {
      total_payments: data?.length || 0,
      total_amount: data?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
      completed_payments: data?.filter(p => p.status === 'completed').length || 0,
      failed_payments: data?.filter(p => p.status === 'failed').length || 0,
      refunded_amount: data?.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0) || 0,
      by_method: {}
    };
    
    data?.forEach(payment => {
      stats.by_method[payment.payment_method] = (stats.by_method[payment.payment_method] || 0) + 1;
    });
    
    return stats;
  },

  // Get invoice
  async getInvoice(invoiceId) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        payments (*),
        bookings (*)
      `)
      .eq('invoice_id', invoiceId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's invoices
  async getUserInvoices(userId) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        payments (
          payment_id,
          amount,
          status,
          paid_at,
          payment_method
        )
      `)
      .eq('payments.user_id', userId)
      .order('issued_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get refund details
  async getRefund(refundId) {
    const { data, error } = await supabase
      .from('refunds')
      .select(`
        *,
        payments (*)
      `)
      .eq('refund_id', refundId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's refunds
  async getUserRefunds(userId) {
    const { data, error } = await supabase
      .from('refunds')
      .select(`
        *,
        payments (
          payment_id,
          amount,
          payment_method,
          paid_at
        )
      `)
      .eq('payments.user_id', userId)
      .order('refunded_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Generate invoice number
  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  },

  // Process payment (mock implementation for now)
  async processPayment(paymentData) {
    // Create payment record
    return this.createPayment({
      ...paymentData,
      status: 'pending'
    });
  },

  // Get all payments (admin only)
  async getAllPayments(filters = {}) {
    let query = supabase
      .from('payments')
      .select(`
        *,
        users (user_id, email, full_name),
        invoices (*),
        refunds (*)
      `);
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};
