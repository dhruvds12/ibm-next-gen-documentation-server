const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    region: 'eu-west-2b'
});

const dynamodb = new AWS.DynamoDB();

const params = {
    TableName: 'UserNotes',
    KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' }  // Partition key
    ],
    AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
};

dynamodb.createTable(params, (err, data) => {
    if (err) {
        console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
    }
});
