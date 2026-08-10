# AGENTS Rules & Guidelines - Data Utility Center

## User Privileges & Super Admin
- **Primary Super Admin Email:** `triyadi72@gmail.com`
- **Role:** Super Admin (Full system access, settings control, storage clear privileges, and AI API configuration).

## Security Rules
1. Only users with `Super Admin` or `Admin` roles can modify system settings (`PUT /api/v1/settings`) and clear storage folders.
2. Maintain hybrid fallback mechanisms for Firestore and local storage.
3. Keep explicit high-contrast text styling for both dark and light modes across all UI components.
