# ibm-next-gen-documentation-server
This repository contains the server-side code for the IBM AR and AI Enhanced Next Generation project. The server manages user authentication, note sharing, and data storage using AWS DynamoDB.
## Setup and Installation

### Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it [here](https://nodejs.org/).
- **AWS Account**: Set up an AWS account with access to DynamoDB.

### Installing Dependencies

Clone the repository and install the necessary dependencies:

```bash
git clone https://github.com/dhruvds12/ibm-next-gen-documentation-server.git
cd ibm-next-gen-documentation-server
npm install
```

### Running the Server

To start the server, run the following command:

```bash
node app.js
```

The server will start on port 3000 by default.

## API Endpoints

### /signup
- **Method**: POST
- **Description**: Handles user registration.
- **Body**:
  - `username`: string
  - `email`: string
  - `password`: string

### /login
- **Method**: POST
- **Description**: Manages user authentication.
- **Body**:
  - `username`: string
  - `password`: string

### /notes
- **Method**: POST
- **Description**: Allows users to post and retrieve notes.
- **Body**:
  - `userId`: string
  - `imageName`: string
  - `noteKey`: string
  - `noteContent`: string

### /share
- **Method**: POST
- **Description**: Facilitates sharing notes with other users.
- **Body**:
  - `userId`: string
  - `imageName`: string
  - `noteKey`: string
  - `shareWithUserId`: string

### /sharedNotes/:userId/:imageName/:noteKey
- **Method**: GET
- **Description**: Retrieves notes shared with the user.

### /users
- **Method**: GET
- **Description**: Provides a list of all registered users.

## Database Schema

Ensure your DynamoDB table is set up with the following structure:

- **Table Name**: `UserNotes`
- **Primary Key**: `userId`
- **Global Secondary Index**: `username-index` for efficient querying by username.

### Example item structure:

```json
{
  "userId": "unique-user-id",
  "username": "user_name",
  "email": "user@example.com",
  "password": "hashed_password",
  "notes": {},
  "sharedNotes": {},
  "sharedWith": {}
}
```