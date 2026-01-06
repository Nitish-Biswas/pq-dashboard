// pages/api/scans.js
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export default async function handler(req, res) {
  try {
    const params = {
      TableName: "PQ_Scan_History",
      Limit: 50
    };

    const data = await dynamoDb.scan(params).promise();

    // Sort by timestamp descending (newest first)
    const sortedItems = data.Items.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.status(200).json(sortedItems);
  } catch (error) {
    console.error("DynamoDB Error:", error);
    res.status(500).json({ error: error.message });
  }
}