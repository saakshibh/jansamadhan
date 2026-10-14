import { v2 as cloudinary } from "cloudinary";

export const uploadToCloudinary = (buffer) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "jansamadhan/complaints", resource_type: "image" },
      (error, result) =>
        error ? reject(error) : resolve({ url: result.secure_url, publicId: result.public_id })
    );
    stream.end(buffer);
  });
};