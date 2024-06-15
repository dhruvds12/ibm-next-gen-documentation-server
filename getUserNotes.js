const AWS = require('aws-sdk');

AWS.config.update({
  region: 'eu-west-2'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const userId = '1234';

const params = {
  TableName: 'UserNotes',
  Key: { userId }
};

dynamoDB.get(params, (err, data) => {
  if (err) {
    console.error('Unable to read item. Error JSON:', JSON.stringify(err, null, 2));
  } else {
    console.log('GetItem succeeded:', JSON.stringify(data, null, 2));
  }
});
