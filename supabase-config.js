// supabase-config.js
const SUPABASE_URL = 'https://zdnsnqkzpnpnrlodrqqh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_C-GKXUstl0mT3jtY6Qe4Xg_c36LjkvI';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const NECO_DB = {
    // Categories
    getCategories: async function() {
        const { data, error } = await supabase.from('categories').select('*').order('id');
        if (error) throw error;
        return data;
    },
    
    // Payment Items
    getPaymentItems: async function() {
        const { data, error } = await supabase.from('payment_items').select('*').order('id');
        if (error) throw error;
        return data;
    },
    
    getItemsByCategory: async function(categoryId) {
        const { data, error } = await supabase.from('payment_items').select('*').eq('category_id', categoryId).order('id');
        if (error) throw error;
        return data;
    },
    
    // PIN Validation
    validatePin: async function(pinCode) {
        const { data, error } = await supabase.from('payment_pins').select('*').eq('pin', pinCode).eq('status', 'active').single();
        if (error || !data) return { valid: false, accountDetails: null };
        if (new Date(data.expires_at) < new Date()) {
            await supabase.from('payment_pins').update({ status: 'expired' }).eq('id', data.id);
            return { valid: false, accountDetails: null };
        }
        return { valid: true, accountDetails: data };
    },
    
    usePin: async function(pinCode) {
        await supabase.from('payment_pins').update({ status: 'used' }).eq('pin', pinCode);
    },
    
    // Payment Record
    addPayment: async function(paymentData) {
        const { data, error } = await supabase.from('payments').insert(paymentData).select();
        if (error) throw error;
        return data[0];
    },
    
    // Form Settings
    getPaymentFormSettings: async function() {
        const { data, error } = await supabase.from('payment_form_settings').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') return null;
        return data;
    },
    
    // Invoice Template
    getInvoiceTemplate: async function() {
        const { data, error } = await supabase.from('invoice_templates').select('*').eq('is_active', true).limit(1).single();
        if (error) return null;
        return data;
    },
    
    // Account Details Template
    getAccountDetailsTemplate: async function() {
        const { data, error } = await supabase.from('account_details_templates').select('*').eq('is_active', true).limit(1).single();
        if (error) return null;
        return data;
    },
    
    // Home Content
    getHomeContent: async function() {
        const { data, error } = await supabase.from('home_content').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') return null;
        return data;
    },
    
    // Site Settings
    getSiteSettings: async function() {
        const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') return null;
        return data;
    }
};

// Make it available globally
window.NECO_DB = NECO_DB;
