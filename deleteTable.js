const AWS = require('aws-sdk');

AWS.config.update({
  region: 'eu-west-2'
});

const dynamodb = new AWS.DynamoDB();

const params = {
  TableName: 'UserNotes'
};

dynamodb.deleteTable(params, (err, data) => {
  if (err) {
    console.error('Unable to delete table. Error JSON:', JSON.stringify(err, null, 2));
  } else {
    console.log('Deleted table. Table description JSON:', JSON.stringify(data, null, 2));
  }
});
