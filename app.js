const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const app = express();
const port = 3000;

app.use(bodyParser.json());

AWS.config.update({
  region: 'eu-west-2'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

app.post('/notes', async (req, res) => {
  const { userId, imageName, noteKey, noteContent } = req.body;

  // First, ensure the notes map exists for the specified imageName
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

    // Now, update the specific note
    const updateNote = {
      TableName: 'UserNotes',
      Key: { userId },
      UpdateExpression: 'set #notes.#imageName.#noteKey = :noteContent',
      ExpressionAttributeNames: {
        '#notes': 'notes',
        '#imageName': imageName,
        '#noteKey': noteKey
      },
      ExpressionAttributeValues: {
        ':noteContent': noteContent
      }
    };

    await dynamoDB.update(updateNote).promise();
    res.json({ message: 'Note saved successfully' });
  } catch (err) {
    console.error('Unable to ensure notes map exists. Error JSON:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: 'Error ensuring notes map exists', error: JSON.stringify(err, null, 2) });
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

      // Ensure the sharedNotes map exists for the shareWithUserId
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
        UpdateExpression: 'set #sharedNotes.#imageName.#noteKey = :noteContent',
        ExpressionAttributeNames: {
          '#sharedNotes': 'sharedNotes',
          '#imageName': imageName,
          '#noteKey': noteKey
        },
        ExpressionAttributeValues: {
          ':noteContent': noteContent
        }
      };

      await dynamoDB.update(shareNoteParams).promise();
      res.json({ message: 'Note shared successfully' });
    } else {
      res.status(404).json({ message: 'Note not found for sharing' });
    }
  } catch (err) {
    console.error('Unable to share note. Error JSON:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: 'Error sharing note', error: JSON.stringify(err, null, 2) });
  }
});

app.get('/sharedNotes/:userId/:imageName', async (req, res) => {
  const { userId, imageName } = req.params;

  const getSharedNotesParams = {
    TableName: 'UserNotes',
    Key: { userId }
  };

  try {
    const data = await dynamoDB.get(getSharedNotesParams).promise();
    if (data.Item && data.Item.sharedNotes && data.Item.sharedNotes[imageName]) {
      res.json(data.Item.sharedNotes[imageName]);
    } else {
      res.status(404).json({ message: 'Shared notes not found' });
    }
  } catch (err) {
    console.error('Unable to retrieve shared notes. Error JSON:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: 'Error retrieving shared notes', error: JSON.stringify(err, null, 2) });
  }
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
