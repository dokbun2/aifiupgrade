// Supabase Configuration and Authentication System

// Supabase Project Credentials
const SUPABASE_URL = 'https://dhilswazlggfgfyozikq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoaWxzd2F6bGdnZmdmeW96aWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzg4MDEsImV4cCI6MjA3MzY1NDgwMX0.MKEQGF6Mwgg3L_hBpIOeKhMXHageGvG4aj_bqL4taHI'

// Initialize Supabase client
let supabase = null;

// Check if Supabase library is loaded
if (typeof window !== 'undefined' && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// User state management
let currentUser = null;

// Auth state change listener
async function initAuth() {
    if (!supabase) {
        console.error('Supabase client not initialized. Please check your configuration.');
        return;
    }

    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateUIForLoggedInUser(session.user);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            updateUIForLoggedInUser(session.user);
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    });
}

// Sign Up Function
async function signUp(email, password, fullName, nickname) {
    try {
        // Sign up the user
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    nickname: nickname,
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff`
                }
            }
        });

        if (error) throw error;

        // Create user profile in profiles table
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        email: email,
                        full_name: fullName,
                        nickname: nickname,
                        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff`,
                        updated_at: new Date().toISOString()
                    }
                ]);

            if (profileError) {
                console.error('Profile creation error:', profileError);
            }
        }

        return { success: true, data, message: '회원가입이 완료되었습니다! 이메일을 확인해주세요.' };
    } catch (error) {
        console.error('SignUp error:', error);
        return { success: false, error: error.message };
    }
}

// Sign In Function
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('SignIn error:', error);
        return { success: false, error: error.message };
    }
}

// Sign Out Function
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('SignOut error:', error);
        return { success: false, error: error.message };
    }
}

// Update User Profile
async function updateProfile(updates) {
    try {
        const user = await getUser();
        if (!user) throw new Error('No user logged in');

        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;

        // Update user metadata
        const { error: metaError } = await supabase.auth.updateUser({
            data: updates
        });

        if (metaError) throw metaError;

        return { success: true, data };
    } catch (error) {
        console.error('UpdateProfile error:', error);
        return { success: false, error: error.message };
    }
}

// Upload Profile Image
async function uploadProfileImage(file) {
    try {
        const user = await getUser();
        if (!user) throw new Error('No user logged in');

        // Create unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Update profile with new avatar URL
        const updateResult = await updateProfile({ avatar_url: publicUrl });

        if (!updateResult.success) throw new Error(updateResult.error);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('UploadProfileImage error:', error);
        return { success: false, error: error.message };
    }
}

// Change Password
async function changePassword(newPassword) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
    } catch (error) {
        console.error('ChangePassword error:', error);
        return { success: false, error: error.message };
    }
}

// Reset Password Request
async function resetPassword(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) throw error;

        return { success: true, message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' };
    } catch (error) {
        console.error('ResetPassword error:', error);
        return { success: false, error: error.message };
    }
}

// Get Current User
async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Get User Profile
async function getUserProfile() {
    try {
        const user = await getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('GetUserProfile error:', error);
        return null;
    }
}

// UI Update Functions
function updateUIForLoggedInUser(user) {
    // Hide login button
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.style.display = 'none';
    }

    // Show user menu
    const userMenuContainer = document.querySelector('.user-menu-container');
    if (userMenuContainer) {
        userMenuContainer.style.display = 'block';

        // Update user info
        const userAvatar = userMenuContainer.querySelector('.user-avatar-img');
        const userName = userMenuContainer.querySelector('.user-name');

        if (userAvatar) {
            userAvatar.src = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'User')}&background=6366f1&color=fff`;
        }

        if (userName) {
            userName.textContent = user.user_metadata?.nickname || user.user_metadata?.full_name || user.email.split('@')[0];
        }
    }

    // Close modals
    closeAuthModal();
}

function updateUIForLoggedOutUser() {
    // Show login button
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.style.display = 'flex';
    }

    // Hide user menu
    const userMenuContainer = document.querySelector('.user-menu-container');
    if (userMenuContainer) {
        userMenuContainer.style.display = 'none';
    }
}

// Close auth modal
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// Export functions for global use
window.supabaseAuth = {
    signUp,
    signIn,
    signOut,
    updateProfile,
    uploadProfileImage,
    changePassword,
    resetPassword,
    getUser,
    getUserProfile,
    initAuth
};