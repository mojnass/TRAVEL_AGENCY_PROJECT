import { apiGet, apiPost, apiPatch } from './api';

export const paymentService = {
  async createPayment(paymentData) {
    return apiPost('/api/payments/checkout', paymentData);
  },

  async getUserPayments() {
    return apiGet('/api/payments');
  },

  async completePayment(paymentId, transactionId = `mock-${Date.now()}`) {
    return apiPatch(`/api/payments/${paymentId}/complete`, { transaction_id: transactionId });
  },

  async updatePaymentStatus(paymentId, status, transactionId = null) {
    if (status === 'completed') {
      return this.completePayment(paymentId, transactionId || `mock-${Date.now()}`);
    }
    return apiPatch(`/api/payments/${paymentId}/complete`, { transaction_id: transactionId || `mock-${Date.now()}` });
  },

  async processPayment(paymentData) {
    const payment = await this.createPayment(paymentData);
    return this.completePayment(payment.payment_id);
  },

  async refundPayment(paymentId, amount, reason = '') {
    return apiPost(`/api/payments/${paymentId}/refund`, { amount, reason });
  },

  async getUserInvoices() {
    return apiGet('/api/payments/invoices');
  },
};
