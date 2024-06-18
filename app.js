const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const crypto = require('crypto');
const app = express();
const port = 3000;

app.use(bodyParser.json());

AWS.config.update({
  region: 'eu-west-2'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Function to generate a unique user ID
function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

// Function to hash a password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Sign-up endpoint
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  const userId = generateUserId();
  const hashedPassword = hashPassword(password);

  const newUser = {
    TableName: 'UserNotes',
    Item: {
      userId: userId,
      username: username,
      email: email,
      password: hashedPassword,
      notes: {},
      sharedNotes: {},
      sharedWith: {}
    }
  };

  try {
    await dynamoDB.put(newUser).promise();
    res.json({ message: 'User signed up successfully', userId: userId });
  } catch (err) {
    console.error('Unable to add user. Error JSON:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: 'Error signing up user', error: JSON.stringify(err, null, 2) });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const hashedPassword = hashPassword(password);

  const params = {
    TableName: 'UserNotes',
    IndexName: 'username-index',
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: {
      ':username': username
    }
  };

  try {
    const data = await dynamoDB.query(params).promise();
    if (data.Items.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = data.Items[0];
    if (user.password !== hashedPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({ message: 'Login successful', userId: user.userId });
  } catch (err) {
    console.error('Unable to login user. Error JSON:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: 'Error logging in user', error: JSON.stringify(err, null, 2) });
  }
});

app.post('/notes', async (req, res) => {
  const { userId, imageName, noteKey, noteContent } = req.body;

  const ensureNotesMapExists = {
    TableName: 'UserNotes',
    Key: { userId },
    UpdateExpression: 'set #notes.#imageName = if_not_exists(#notes.#imageName, :emptyMap)',
    ExpressionAttributeNames: {
      '#notes': 'notes',
      '#imageName': imageName
    },
    ExpressionAttributeValues: {
      ':emptyMap': {}
    }
  };

  try {
    await dynamoDB.update(ensureNotesMapExists).promise();
    console.log('Notes map ensured. Proceeding to update the note.');

    const updateNote = {
      TableName: 'UserNotes',
      Key: { userId },
      UpdateExpression: 'set #notes.#imageName.#noteKey = :noteContent, #notes.#imageName.#noteKeySharedWith = if_not_exists(#notes.#imageName.#noteKeySharedWith, :emptyList)',
      ExpressionAttributeNames: {
        '#notes': 'notes',
        '#imageName': imageName,
        '#noteKey': noteKey,
        '#noteKeySharedWith': `${noteKey}SharedWith`
      },
      ExpressionAttributeValues: {
        ':noteContent': noteContent,
        ':emptyList': []
      }
    };

    await dynamoDB.update(updateNote).promise();
    res.json({ message: 'Note saved successfully' });
  } catch (err) {
    console.error('Unable to ensure notes map exists or update note. Error JSON:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: 'Error ensuring notes map exists or updating note', error: JSON.stringify(err, null, 2) });
  }
});

app.get('/notes/:userId/:imageName/:noteKey', async (req, res) => {
  const { userId, imageName, noteKey } = req.params;

  const getNoteParams = {
    TableName: 'UserNotes',
    Key: { userId }
  };

  try {
    const data = await dynamoDB.get(getNoteParams).promise();
    if (data.Item && data.Item.notes && data.Item.notes[imageName] && data.Item.notes[imageName][noteKey]) {
      res.json({ noteContent: data.Item.notes[imageName][noteKey] });
    } else {
      res.status(404).json({ message: 'Note not found' });
    }
  } catch (err) {
    console.error('Unable to retrieve note. Error JSON:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: 'Error retrieving note', error: JSON.stringify(err, null, 2) });
  }
});

app.post('/share', async (req, res) => {
  const { userId, imageName, noteKey, shareWithUserId } = req.body;

  const getNoteParams = {
    TableName: 'UserNotes',
    Key: { userId }
  };

  try {
    const data = await dynamoDB.get(getNoteParams).promise();
    if (data.Item && data.Item.notes && data.Item.notes[imageName] && data.Item.notes[imageName][noteKey]) {
      const noteContent = data.Item.notes[imageName][noteKey];

      const ensureSharedNotesMapExists = {
        TableName: 'UserNotes',
        Key: { userId: shareWithUserId },
        UpdateExpression: 'set #sharedNotes.#imageName = if_not_exists(#sharedNotes.#imageName, :emptyMap)',
        ExpressionAttributeNames: {
          '#sharedNotes': 'sharedNotes',
          '#imageName': imageName
        },
        ExpressionAttributeValues: {
          ':emptyMap': {}
        }
      };

      await dynamoDB.update(ensureSharedNotesMapExists).promise();
      console.log('Shared notes map ensured. Proceeding to share the note.');

      const shareNoteParams = {
        TableName: 'UserNotes',
        Key: { userId: shareWithUserId },
        UpdateExpression: 'set #sharedNotes.#imageName.#noteKey = list_append(if_not_exists(#sharedNotes.#imageName.#noteKey, :emptyList), :userId)',
        ExpressionAttributeNames: {
          '#sharedNotes': 'sharedNotes',
          '#imageName': imageName,
          '#noteKey': noteKey
        },
        ExpressionAttributeValues: {
          ':userId': [userId],
          ':emptyList': []
        }
      };

      await dynamoDB.update(shareNoteParams).promise();

      const updateSharedWith = {
        TableName: 'UserNotes',
        Key: { userId },
        UpdateExpression: 'set #notes.#imageName.#noteKeySharedWith = list_append(if_not_exists(#notes.#imageName.#noteKeySharedWith, :emptyList), :shareWithUserId)',
        ExpressionAttributeNames: {
          '#notes': 'notes',
          '#imageName': imageName,
          '#noteKeySharedWith': `${noteKey}SharedWith`
        },
        ExpressionAttributeValues: {
          ':shareWithUserId': [shareWithUserId],
          ':emptyList': []
        }
      };

      await dynamoDB.update(updateSharedWith).promise();

      res.json({ message: 'Note shared successfully' });
    } else {
      res.status(404).json({ message: 'Note not found for sharing' });
    }
  } catch (err) {
    console.error('Unable to share note. Error JSON:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: 'Error sharing note', error: JSON.stringify(err, null, 2) });
  }
});

app.get('/sharedNotes/:userId/:imageName/:noteKey', async (req, res) => {
  const { userId, imageName, noteKey } = req.params;

  const getSharedNotesParams = {
    TableName: 'UserNotes',
    Key: { userId }
  };

  try {
    const data = await dynamoDB.get(getSharedNotesParams).promise();
    if (data.Item && data.Item.sharedNotes && data.Item.sharedNotes[imageName] && data.Item.sharedNotes[imageName][noteKey]) {
      res.json(data.Item.sharedNotes[imageName][noteKey]);
    } else {
      res.status(404).json({ message: 'Shared notes not found' });
    }
  } catch (err) {
    console.error('Unable to retrieve shared notes. Error JSON:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: 'Error retrieving shared notes', error: JSON.stringify(err, null, 2) });
  }
});

// Endpoint to get list of users
app.get('/users', async (req, res) => {
  const params = {
    TableName: 'UserNotes',
    ProjectionExpression: 'userId, username' // Retrieve userId and username attributes
  };

  try {
    const data = await dynamoDB.scan(params).promise();
    const users = data.Items.map(item => ({ userId: item.userId, username: item.username }));
    res.json(users);
  } catch (err) {
    console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: 'Error scanning table', error: JSON.stringify(err, null, 2) });
  }
});


app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
