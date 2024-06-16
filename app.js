const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');

const app = express();
const port = 3000;

// Configure AWS SDK
AWS.config.update({
  region: 'eu-west-2'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json());

// Endpoint to add or update a note
app.post('/notes', (req, res) => {
  const { userId, noteKey, noteContent } = req.body;

  // First, ensure the notes map exists
  const ensureNotesMapExists = {
    TableName: 'UserNotes',
    Key: { userId },
    UpdateExpression: 'set #notes = if_not_exists(#notes, :emptyMap)',
    ExpressionAttributeNames: {
      '#notes': 'notes'
    },
    ExpressionAttributeValues: {
      ':emptyMap': {}
    }
  };

  // Then, update the specific note
  const updateNote = {
    TableName: 'UserNotes',
    Key: { userId },
    UpdateExpression: 'set #notes.#noteKey = :noteContent',
    ExpressionAttributeNames: {
      '#notes': 'notes',
      '#noteKey': noteKey
    },
    ExpressionAttributeValues: {
      ':noteContent': noteContent
    }
  };

  // Perform the update operations
  dynamoDB.update(ensureNotesMapExists, (err, data) => {
    if (err) {
      console.error('Unable to ensure notes map exists. Error JSON:', JSON.stringify(err, null, 2));
      res.status(500).send('Error ensuring notes map exists');
    } else {
      console.log('Notes map ensured. Proceeding to update the note.');

      // Now update the specific note
      dynamoDB.update(updateNote, (err, data) => {
        if (err) {
          console.error('Unable to update note. Error JSON:', JSON.stringify(err, null, 2));
          res.status(500).send('Error updating note');
        } else {
          console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2));
          res.status(200).send('Note updated successfully');
        }
      });
    }
  });
});

// Endpoint to get a specific note
app.get('/notes/:userId/:noteKey', (req, res) => {
  const userId = req.params.userId;
  const noteKey = req.params.noteKey;

  const params = {
    TableName: 'UserNotes',
    Key: { userId },
    ProjectionExpression: `#notes.#noteKey`,
    ExpressionAttributeNames: {
      '#notes': 'notes',
      '#noteKey': noteKey
    }
  };

  dynamoDB.get(params, (err, data) => {
    if (err) {
      console.error('Unable to read item. Error JSON:', JSON.stringify(err, null, 2));
      res.status(500).send('Error retrieving note');
    } else {
      if (data.Item && data.Item.notes && data.Item.notes[noteKey]) {
        const noteContent = data.Item.notes[noteKey];
        res.status(200).json({ noteContent });
      } else {
        res.status(404).send('Note not found');
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
