const { BlobServiceClient } = require("@azure/storage-blob");
const ffmpeg = require("fluent-ffmpeg");
const { knex } = require("../db/connection");
const stream = require("stream");

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;

async function uploadToAzure(buffer, blobName, containerName) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);

  await blockBlobClient.uploadStream(bufferStream);
  console.log(`Upload block blob ${blobName} successfully`);

  return blockBlobClient.url;
}

function createVideoVariation(inputPath, resolution) {
  return new Promise((resolve, reject) => {
    const bufferStream = new stream.PassThrough();
    const ffmpegProcess = ffmpeg(inputPath)
      .size(resolution)
      .on("error", (err) => {
        console.error(`Error creating video variation: ${err.message}`);
        reject(err);
      });

    ffmpegProcess.pipe(bufferStream, { end: true });
    resolve(bufferStream);
  });
}

function extractFrame(inputPath, size) {
  return new Promise((resolve, reject) => {
    const bufferStream = new stream.PassThrough();
    const ffmpegProcess = ffmpeg(inputPath)
      .screenshots({
        count: 1,
        size: size,
      })
      .on("error", (err) => {
        console.error(`Error extracting frame: ${err.message}`);
        reject(err);
      });

    ffmpegProcess.pipe(bufferStream, { end: true });
    resolve(bufferStream);
  });
}

function cropVideo(inputPath) {
  return new Promise((resolve, reject) => {
    const bufferStream = new stream.PassThrough();
    const ffmpegProcess = ffmpeg(inputPath)
      .videoFilters("crop=in_w:in_h/2:0:0") // Crop to half the height from the top
      .on("error", (err) => {
        console.error(`Error cropping video: ${err.message}`);
        reject(err);
      });

    ffmpegProcess.pipe(bufferStream, { end: true });
    resolve(bufferStream);
  });
}

async function processAvatar(id) {
  const [record] = await knex("avatars").where({ id });

  if (!record || record.operation !== "pending") {
    console.log("No pending operation found for the given ID.");
    return;
  }

  const { full_body_video } = record;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  try {
    await knex("avatars").where({ id }).update({ operation: "progress" });

    // Generate and upload photos and videos
    const fullBodyFrameStream = await extractFrame(full_body_video, "640x480");
    const fullBodyPhotoUrl = await uploadToAzure(
      fullBodyFrameStream.read(),
      `full_body_photo_${id}.jpg`,
      containerName
    );

    const fullBodyUrls = { original: full_body_video, photo: fullBodyPhotoUrl };
    const fullBodyVariations = [
      { resolution: "426x240", blobName: `full_body_240p_${id}.mp4` },
      { resolution: "640x360", blobName: `full_body_360p_${id}.mp4` },
      { resolution: "854x480", blobName: `full_body_480p_${id}.mp4` },
      { resolution: "1280x720", blobName: `full_body_720p_${id}.mp4` },
    ];

    for (const variation of fullBodyVariations) {
      const variationStream = await createVideoVariation(
        full_body_video,
        variation.resolution
      );
      const variationUrl = await uploadToAzure(
        variationStream.read(),
        variation.blobName,
        containerName
      );
      fullBodyUrls[variation.resolution] = variationUrl;
    }

    const halfBodyFrameStream = await extractFrame(full_body_video, "640x480");
    const halfBodyPhotoUrl = await uploadToAzure(
      halfBodyFrameStream.read(),
      `half_body_photo_${id}.jpg`,
      containerName
    );
    const halfBodyUrls = { original: full_body_video, photo: halfBodyPhotoUrl };

    const halfBodyVariations = [
      { resolution: "426x240", blobName: `half_body_240p_${id}.mp4` },
      { resolution: "640x360", blobName: `half_body_360p_${id}.mp4` },
      { resolution: "854x480", blobName: `half_body_480p_${id}.mp4` },
      { resolution: "1280x720", blobName: `half_body_720p_${id}.mp4` },
    ];

    for (const variation of halfBodyVariations) {
      const variationStream = await createVideoVariation(
        full_body_video,
        variation.resolution
      );
      const variationUrl = await uploadToAzure(
        variationStream.read(),
        variation.blobName,
        containerName
      );
      halfBodyUrls[variation.resolution] = variationUrl;
    }

    const faceVideoStream = await cropVideo(full_body_video);
    const faceVideoUrl = await uploadToAzure(
      faceVideoStream.read(),
      `face_video_${id}.mp4`,
      containerName
    );

    const faceFrameStream = await extractFrame(faceVideoUrl, "640x480");
    const facePhotoUrl = await uploadToAzure(
      faceFrameStream.read(),
      `face_photo_${id}.jpg`,
      containerName
    );
    const faceUrls = { original: faceVideoUrl, photo: facePhotoUrl };

    const faceVariations = [
      { resolution: "426x240", blobName: `face_240p_${id}.mp4` },
      { resolution: "640x360", blobName: `face_360p_${id}.mp4` },
      { resolution: "854x480", blobName: `face_480p_${id}.mp4` },
      { resolution: "1280x720", blobName: `face_720p_${id}.mp4` },
    ];

    for (const variation of faceVariations) {
      const variationStream = await createVideoVariation(
        faceVideoUrl,
        variation.resolution
      );
      const variationUrl = await uploadToAzure(
        variationStream.read(),
        variation.blobName,
        containerName
      );
      faceUrls[variation.resolution] = variationUrl;
    }

    await saveVideoDetails(id, fullBodyUrls, halfBodyUrls, faceUrls);
    await knex("avatars").where({ id }).update({ operation: "complete" });
  } catch (err) {
    console.error("Error in workflow:", err);
    await knex("avatars").where({ id }).update({ operation: "pending" }); // Revert to pending if there's an error
  }
}

async function saveVideoDetails(id, fullBodyUrls, halfBodyUrls, faceUrls) {
  await knex("avatars").where({ id }).update({
    full_body_photo: fullBodyUrls.photo,
    full_body_video_240p: fullBodyUrls["426x240"],
    full_body_video_360p: fullBodyUrls["640x360"],
    full_body_video_480p: fullBodyUrls["854x480"],
    full_body_video_720p: fullBodyUrls["1280x720"],
    half_body_photo: halfBodyUrls.photo,
    half_body_video_240p: halfBodyUrls["426x240"],
    half_body_video_360p: halfBodyUrls["640x360"],
    half_body_video_480p: halfBodyUrls["854x480"],
    half_body_video_720p: halfBodyUrls["1280x720"],
    face_photo: faceUrls.photo,
    face_video: faceUrls.original,
    face_video_240p: faceUrls["426x240"],
    face_video_360p: faceUrls["640x360"],
    face_video_480p: faceUrls["854x480"],
    face_video_720p: faceUrls["1280x720"],
    is_active: true,
    created_at: knex.fn.now(),
  });
  console.log("Video details saved to DB for id:", id);
}

// Example usage
const avatarId = 1; // Replace with the actual avatar ID you want to process
processAvatar(avatarId);
