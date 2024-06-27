const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: 'eu-west-2'
});

// Create DynamoDB service object
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Get the userId from command-line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a userId as a command-line argument.');
  process.exit(1);
}

// Define the parameters for the DynamoDB get operation
const params = {
  TableName: 'UserNotes',
  Key: { userId }
};

// Perform the DynamoDB get operation
dynamoDB.get(params, (err, data) => {
  if (err) {
    console.error('Unable to read item. Error JSON:', JSON.stringify(err, null, 2));
  } else {
    console.log('GetItem succeeded:', JSON.stringify(data, null, 2));
  }
});
