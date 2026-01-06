// pages/api/get-report.js
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export default async function handler(req, res) {
  const { key } = req.query; 

  if (!key || key === 'null') {
    return res.status(400).json({ error: 'Invalid file key' });
  }

  try {
    // Generate a secure URL valid for 5 minutes
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: 'nitish-pq-reports-private', // MUST match your bucket name exactly
      Key: key,
      Expires: 300, 
    });

    res.status(200).json({ url });
  } catch (error) {
    console.error("S3 Error:", error);
    res.status(500).json({ error: 'Failed to generate secure link' });
  }
}