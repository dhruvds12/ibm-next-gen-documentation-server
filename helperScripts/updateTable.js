const AWS = require('aws-sdk');

AWS.config.update({
  region: 'eu-west-2'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const userId = '5678';
const noteKey = 'general_note';
const noteContent = 'some string';

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
  } else {
    console.log('Notes map ensured. Proceeding to update the note.');

    // Now update the specific note
    dynamoDB.update(updateNote, (err, data) => {
      if (err) {
        console.error('Unable to update note. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2));
      }
    });
  }
});
