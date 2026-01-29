# Frontend Implementation for Process Role Features

## Overview
Frontend components and services have been created/updated to support the process role functionality and user-process linking.

## Files Created

### 1. **LinkUserProcessForm.jsx** (`frontend/src/components/forms/LinkUserProcessForm.jsx`)
A form component for linking users with process role to specific processes.

**Features:**
- Dropdown to select users with process role
- Dropdown to select processes
- Form validation
- Success/error handling with toast notifications

**Props:**
- `onSuccess`: Callback function called after successful linking
- `onCancel`: Callback function for cancel action

### 2. **UserForm.jsx** (`frontend/src/components/forms/UserForm.jsx`)
A comprehensive form for creating and editing users with all roles including 'process'.

**Features:**
- Username, password, name, role, email, contact number fields
- Role dropdown with all 4 roles (admin, supervisor, security, process)
- Form validation
- Different behavior for create vs edit (password optional on edit)
- Toast notifications for success/error

**Props:**
- `initialData`: User object for editing (undefined for create)
- `onSuccess`: Callback after successful operation
- `onCancel`: Callback for cancel action

## Files Updated

### 1. **auth.service.js** (`frontend/src/services/auth.service.js`)
Added new API methods:

```javascript
// Get all users
export const getAllUsers = async () => {...}

// Get users by role
export const getUsersByRole = async (role) => {...}

// Link user to process
export const linkUserToProcess = async (userId, processId) => {...}

// Create user
export const createUser = async (userData) => {...}

// Update user
export const updateUser = async (id, userData) => {...}

// Delete user
export const deleteUser = async (id) => {...}
```

### 2. **UsersPage.jsx** (`frontend/src/pages/Admin/UsersPage.jsx`)
Enhanced the existing Users Management page with new features:

**New Features Added:**
- "Link User to Process" button in header
- New modal for linking users to processes
- Integrated LinkUserProcessForm component
- Fetches processes on component mount
- Filters users by process role for linking

**New State Variables:**
```javascript
const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
const [processes, setProcesses] = useState([]);
const [linkFormData, setLinkFormData] = useState({ userId: '', processId: '' });
```

**New Functions:**
```javascript
const fetchProcesses = async () => {...}
const openLinkModal = () => {...}
const handleLinkSubmit = async (e) => {...}
```

### 3. **ProcessesPage.jsx** (`frontend/src/pages/Admin/ProcessesPage.jsx`)
Added display of assigned user information:

**New Column Added:**
- "Assigned User" column showing:
  - User icon
  - User's full name
  - Username (with @ prefix)
  - "Not Assigned" badge if no user linked

## Already Existing (No Changes Needed)

### 1. **user.service.js**
Already had all necessary API methods including:
- `getAllUsers()`
- `getUsersByRole(role)`
- `linkUserToProcess(userId, processId)`
- `createUser(userData)`
- `updateUser(userId, userData)`
- `deleteUser(userId)`

### 2. **constants.js**
Already included:
- 'process' in ROLES enum
- 'process' in ROLE_OPTIONS array
- Process role styling in ROLE_COLORS
- Process role description in ROLE_DESCRIPTIONS

## Usage Guide

### Creating a User with Process Role

1. Navigate to Users Management page
2. Click "Add User" button
3. Fill in the form with:
   - Username
   - Password
   - Full Name
   - Role: Select "Process"
   - Email (optional)
   - Contact Number (optional)
4. Click "Create User"

### Linking a User to a Process

1. Navigate to Users Management page
2. Click "Link User to Process" button
3. Select a user with process role from dropdown
4. Select a process from dropdown
5. Click "Link User to Process"

### Viewing Process Assignments

1. Navigate to Processes page
2. The "Assigned User" column shows:
   - User's name and username if assigned
   - "Not Assigned" badge if no user linked

## API Integration

All frontend components properly integrate with the backend endpoints:

- `GET /api/auth/users` - Get all users
- `GET /api/auth/users/role/:role` - Get users by role
- `POST /api/auth/users` - Create new user
- `PUT /api/auth/users/:id` - Update user
- `DELETE /api/auth/users/:id` - Delete user
- `POST /api/auth/users/link-process` - Link user to process
- `GET /api/processes` - Get all processes (with user population)

## UI Components Used

- **Button**: Primary actions and icon buttons
- **Input**: Text input fields
- **Select**: Dropdown selections
- **Modal**: Dialog windows for forms
- **Badge**: Status indicators
- **Table**: Data display
- **Spinner**: Loading states
- **Toast**: Success/error notifications

## Error Handling

All forms and API calls include proper error handling:
- Try-catch blocks for API calls
- Toast notifications for user feedback
- Form validation before submission
- Loading states during operations

## Responsive Design

All components are responsive and work on:
- Desktop
- Tablet
- Mobile devices

The layout uses Tailwind CSS for responsive design with flex layouts and proper spacing.
