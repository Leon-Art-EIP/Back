import multer from "multer";
import path from "path";
import logger from "../admin/logger.mjs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueFilename = Date.now() + path.extname(file.originalname);
    logger.info(`File uploaded: ${uniqueFilename}`);
    cb(null, uniqueFilename); // Generating unique file name
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // max file size: 50MB
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    logger.warn(`File upload error: Invalid file type - ${file.originalname}`);
    cb("Error: Images Only!");
  },
});

export const uploadProfilePicture = upload.single("profilePicture");
export const uploadBannerPicture = upload.single("bannerPicture");
export const uploadArtImage = upload.single("image");
export const uploadArticleImage = upload.single("mainImage");

// Middleware to handle file upload errors
export const handleFileUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    logger.error(`Multer error: ${err.message}`);
    return res.status(400).json({ msg: err.message });
  } else if (err) {
    // An unknown error occurred when uploading.
    logger.error(`Unknown error: ${err}`);
    return res.status(400).json({ msg: err });
  }

  // If no error, continue to the next middleware
  next();
};
