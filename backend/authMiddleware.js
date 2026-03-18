import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

/**
 * Security: Validates the Supabase JWT (Access Token) 
 * extracted from the Authorization: Bearer <token> header.
 */
export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired session token.' });
        }

        // Attach user object to request
        req.user = user;

        // Fetch additional profile data (Role)
        const { data: profile } = await supabase
            .from('staff_profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
        req.user.role = profile?.role || 'Staff';
        
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(500).json({ error: 'Internal Security Error' });
    }
};

/**
 * RBAC: Restricts access to Admin roles only.
 * Must be used AFTER requireAuth.
 */
export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied: Administrative privileges required.' });
    }
    next();
};
