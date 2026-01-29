# Process Role Implementation

## Overview
The "process" role has been successfully added to the system, allowing users to be assigned as process managers. This implementation creates a relationship between the Users and Processes databases.

## Changes Made

### 1. User Model (`models/User.js`)
- Added `'process'` to the role enum: `['admin', 'supervisor', 'security', 'process']`
- This allows users to be created with a "process" role

### 2. Process Model (`models/Process.js`)
- Added `userId` field to link a process to a user
- Type: `mongoose.Schema.Types.ObjectId` referencing the User model
- This creates the database relationship between Process and User

### 3. Process Controller (`controllers/processController.js`)
- **createProcess**: Now accepts `userId` in request body
- **getAllProcesses**: Populates user information (name, username, email)
- **getProcessById**: Populates user information
- **updateProcess**: Allows updating the `userId` field
- **getProcessesByUser**: New method to get all processes assigned to a specific user

### 4. Auth Controller (`controllers/authController.js`)
- Added `Process` model import
- **linkUserToProcess**: New method to link a user with process role to a specific process
  - Validates user has "process" role
  - Updates the process with the userId
- **getUsersByRole**: New method to get users filtered by role

### 5. Process Routes (`routes/processRoutes.js`)
- Added `getProcessesByUser` to imports
- Added new route: `GET /user/:userId` - Get processes by user
- Updated route permissions to include 'process' role where appropriate

### 6. Auth Routes (`routes/authRoutes.js`)
- Added new imports: `linkUserToProcess`, `getUsersByRole`
- Added new route: `GET /users/role/:role` - Get users by role
- Added new route: `POST /users/link-process` - Link a user to a process

## API Endpoints

### Process Management

#### Create Process with User Assignment
```
POST /api/processes
Body: {
  "processId": "PROC001",
  "processName": "Assembly Line",
  "userId": "user_mongodb_id"  // Optional
}
```

#### Update Process User Assignment
```
PUT /api/processes/:processId
Body: {
  "userId": "user_mongodb_id"
}
```

#### Get Processes by User
```
GET /api/processes/user/:userId
```

### User Management

#### Create Process User
```
POST /api/auth/users
Body: {
  "username": "processuser1",
  "password": "password123",
  "name": "Process Manager 1",
  "role": "process",
  "email": "processmanager@example.com"
}
```

#### Link User to Process
```
POST /api/auth/users/link-process
Body: {
  "userId": "user_mongodb_id",
  "processId": "PROC001"
}
```

#### Get Users by Role
```
GET /api/auth/users/role/process
```

## Usage Workflow

1. **Create a user with process role:**
   ```javascript
   POST /api/auth/users
   {
     "username": "proc_manager",
     "password": "secure_password",
     "name": "John Doe",
     "role": "process"
   }
   ```

2. **Create a process and assign it to the user:**
   ```javascript
   POST /api/processes
   {
     "processId": "PROC001",
     "processName": "Assembly",
     "userId": "673abc123def456789012345"
   }
   ```

3. **Or link existing user to existing process:**
   ```javascript
   POST /api/auth/users/link-process
   {
     "userId": "673abc123def456789012345",
     "processId": "PROC001"
   }
   ```

4. **Get all processes for a user:**
   ```javascript
   GET /api/processes/user/673abc123def456789012345
   ```

## Database Relationships

```
User (with role: "process")
  ↓
  |_id
  ↓
Process
  |
  userId (references User._id)
```

## Permissions

- **Admin**: Full access to all endpoints
- **Supervisor**: Can view processes and users
- **Process**: Can view processes assigned to them
- **Security**: Limited access (not related to process management)

## Notes

- A process can be assigned to only one user at a time
- A user with "process" role can be assigned to multiple processes
- The relationship is optional - processes can exist without an assigned user
- When getting processes, user information is automatically populated if available
