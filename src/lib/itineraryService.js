import { supabase } from './supabase';

export const itineraryService = {
  // Generate PDF itinerary for a user bundle
  async generateItineraryPDF(userBundleId) {
    try {
      // Fetch bundle data with all components
      const { data: bundle, error: bundleError } = await supabase
        .from('user_bundles')
        .select(`
          *,
          users (user_id, email, full_name, phone),
          bundle_bookings (
            bookings (
              *,
              booking_passengers (*),
              booking_extras (*)
            )
          )
        `)
        .eq('user_bundle_id', userBundleId)
        .single();

      if (bundleError) throw bundleError;

      // Generate PDF content (mock implementation - will use jsPDF later)
      await this.createPDFContent(bundle);
      
      // For now, return a mock PDF URL
      const pdfUrl = `https://supabase-storage-url/itineraries/${userBundleId}.pdf`;
      
      // Save PDF URL to bundle record
      await this.saveItineraryPDF(userBundleId, pdfUrl);
      
      return {
        pdfUrl,
        bundle,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  },

  // Create PDF content structure
  async createPDFContent(bundle) {
    const compositionData = bundle.composition_data;
    const bookings = bundle.bundle_bookings?.map(bb => bb.bookings) || [];
    
    return {
      title: bundle.composition_data?.name || 'Travel Itinerary',
      destination: bundle.composition_data?.destination || 'Unknown Destination',
      customer: {
        name: bundle.users?.full_name || 'Customer',
        email: bundle.users?.email,
        phone: bundle.users?.phone
      },
      items: compositionData?.items || [],
      bookings: bookings,
      pricing: {
        original: compositionData?.total_original_price || 0,
        discounted: compositionData?.discounted_price || 0,
        savings: (compositionData?.total_original_price || 0) - (compositionData?.discounted_price || 0)
      },
      generatedAt: new Date().toISOString(),
      bundleId: bundle.user_bundle_id,
      shareableLink: bundle.shareable_link
    };
  },

  // Save PDF URL to bundle record
  async saveItineraryPDF(userBundleId, pdfUrl) {
    const { data, error } = await supabase
      .from('user_bundles')
      .update({ itinerary_pdf_url: pdfUrl })
      .eq('user_bundle_id', userBundleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get existing PDF URL
  async getItineraryPDF(userBundleId) {
    const { data, error } = await supabase
      .from('user_bundles')
      .select('itinerary_pdf_url, shareable_link')
      .eq('user_bundle_id', userBundleId)
      .single();

    if (error) throw error;
    return data;
  },

  // Email itinerary to customer
  async emailItinerary(userBundleId, recipientEmail = null) {
    try {
      const bundle = await this.getItineraryPDF(userBundleId);
      
      if (!bundle.itinerary_pdf_url) {
        // Generate PDF if it doesn't exist
        await this.generateItineraryPDF(userBundleId);
        const updatedBundle = await this.getItineraryPDF(userBundleId);
        bundle.itinerary_pdf_url = updatedBundle.itinerary_pdf_url;
      }

      // Send email notification
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: (await supabase.from('user_bundles').select('user_id').eq('user_bundle_id', userBundleId).single()).data?.user_id,
          type: 'itinerary_ready',
          title: 'Your Travel Itinerary is Ready',
          content: `Your travel itinerary has been generated. Download it here: ${bundle.itinerary_pdf_url}`
        })
        .select()
        .single();

      if (notificationError) throw notificationError;

      // Add to email queue
      await supabase
        .from('email_queue')
        .insert({
          recipient: recipientEmail || (await supabase.from('users').select('email').eq('user_id', (await supabase.from('user_bundles').select('user_id').eq('user_bundle_id', userBundleId).single()).data?.user_id).single()).data?.email,
          subject: 'Your Travel Itinerary - Patronus Travel',
          body: `Dear Customer,<br><br>Your travel itinerary is ready for download.<br><br>Download your PDF: <a href="${bundle.itinerary_pdf_url}">Click Here</a><br><br>Best regards,<br>Patronus Travel Team`,
          attachments: JSON.stringify([{
            name: 'itinerary.pdf',
            url: bundle.itinerary_pdf_url
          }])
        });

      return notification;
      
    } catch (error) {
      console.error('Email itinerary failed:', error);
      throw error;
    }
  },

  // Create bundle checkout record
  async createBundleCheckout(userBundleId, paymentId) {
    const { data, error } = await supabase
      .from('bundle_checkouts')
      .insert({
        user_bundle_id: userBundleId,
        payment_id: paymentId,
        pdf_generated: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update bundle checkout with PDF info
  async updateBundleCheckout(checkoutId, pdfUrl) {
    const { data, error } = await supabase
      .from('bundle_checkouts')
      .update({
        pdf_generated: true,
        pdf_url: pdfUrl
      })
      .eq('checkout_id', checkoutId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get bundle checkout details
  async getBundleCheckout(userBundleId) {
    const { data, error } = await supabase
      .from('bundle_checkouts')
      .select(`
        *,
        payments (*),
        user_bundles (*)
      `)
      .eq('user_bundle_id', userBundleId)
      .single();

    if (error) throw error;
    return data;
  },

  // Download PDF (returns download URL)
  async downloadPDF(userBundleId) {
    const bundle = await this.getItineraryPDF(userBundleId);
    
    if (!bundle.itinerary_pdf_url) {
      const generated = await this.generateItineraryPDF(userBundleId);
      return generated.pdfUrl;
    }
    
    return bundle.itinerary_pdf_url;
  },

  // Generate QR code for bundle
  async generateBundleQR(userBundleId) {
    const bundle = await this.getItineraryPDF(userBundleId);
    const qrData = {
      bundleId: userBundleId,
      shareableLink: bundle.shareable_link,
      customer: bundle.shareable_link
    };
    
    // Mock QR code generation - would use qrcode library
    return `data:image/png;base64,mock-qr-code-for-${encodeURIComponent(JSON.stringify(qrData))}`;
  },

  // Get all user itineraries
  async getUserItineraries(userId) {
    const { data, error } = await supabase
      .from('user_bundles')
      .select(`
        *,
        bundle_bookings (
          bookings (booking_id, status, total_price, booking_type)
        )
      `)
      .eq('user_id', userId)
      .not('itinerary_pdf_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
