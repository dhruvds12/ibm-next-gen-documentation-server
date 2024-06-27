const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: 'eu-west-2'
});

const docClient = new AWS.DynamoDB.DocumentClient();

// Get the userId from command-line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a userId as a command-line argument.');
  process.exit(1);
}

const userItem = {
  TableName: 'UserNotes',
  Item: {
    userId: userId, // Use the provided userId
    notes: {},      // Initialize with an empty notes map
    sharedNotes: {}, // Initialize with an empty sharedNotes map
    sharedWith: {} // Initialize with an empty sharedWith map
  }
};

docClient.put(userItem, (err, data) => {
  if (err) {
    console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
  } else {
    console.log('Added item:', JSON.stringify(data, null, 2));
  }
});
