// =============================================================================
// USER CONSTANTS
// =============================================================================
// Temporary hardcoded user for demo/development
// Replace with Supabase Auth when ready for production
// =============================================================================
// CREATED: December 9, 2025 - Demo user for Ryan testing
// =============================================================================

// Jordan Taylor - our test user
// To change the demo user, update this UUID to match a different profiles record
export const DEMO_USER_ID = 'f0fa48cc-0a2b-4628-8105-60ac5d5bb18f';

// When you add Supabase Auth, replace usage of DEMO_USER_ID with:
// const { data: { user } } = await supabase.auth.getUser();
// const userId = user?.id;