const AWS = require("aws-sdk");
const fs = require("fs");
const logger = require("./logger");
const path = require("path");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS access key
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS secret key
  region: process.env.AWS_REGION, // Your AWS region
});

const s3 = new AWS.S3();

const uploadAudioToS3 = async (audioData, folderName) => {
  try {
    // Assuming audioData is an object with 'path', 'originalname', and 'mimetype' properties
    const audioFilePath = audioData.path;

    // Extract the file extension from the original file name or mimetype
    let extension = path.extname(audioData.originalname);
    if (!extension) {
      // If the original name does not have an extension, infer it from the mimetype
      switch (audioData.mimetype) {
        case "audio/mpeg":
          extension = ".mp3";
          break;
        case "audio/wav":
          extension = ".wav";
          break;
        // Add cases for other mimetypes as necessary
        default:
          extension = "";
      }
    }

    const fileNameWithExtension =
      path.basename(
        audioData.originalname,
        path.extname(audioData.originalname)
      ) + extension;
    // Create a read stream from the audio file
    const audioStream = fs.createReadStream(audioFilePath);

    const key = `audio-uploads/${folderName}/raw/${fileNameWithExtension}`;

    // Set the parameters for the S3 upload
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: audioStream,
      ContentType: audioData.mimetype,
    };

    logger.info("Uploading audio to S3:", key);
    // Perform the upload to S3
    const s3UploadResponse = await s3.upload(s3Params).promise();

    logger.info("Deleting temp file:", audioFilePath);
    fs.unlinkSync(audioFilePath); // Empty temp folder
    // Return the URL of the uploaded file

    return s3UploadResponse.Location;
  } catch (error) {
    logger.error({
      message: `An error occurred ${error.message}`,
      error: error,
    });
    throw error; // Rethrow the error to be handled by the caller
  }
};

module.exports = {
  uploadAudioToS3,
};
