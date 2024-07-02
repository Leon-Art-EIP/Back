import express from 'express';
import multer from 'multer';
import sharp from 'sharp';

const router = express.Router();
/**
 * @swagger
 * /api/convertImage:
 *  post:
 *    summary: Convert image to different format
 *    description: Convert image to different format
 *    tags: [Convert Image]
 *    requestBody:
 *      required: true
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              image:
 *                type: string
 *                format: binary
 *                description: Image to convert
 *              format:
 *                type: string
 *                description: Format to convert to
 *                example: 'png'
 *    responses:
 *      200:
 *        description: Image converted successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                image:
 *                  type: string
 *                  description: Base64 encoded converted image
 *                  example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...'
 *      400:
 *        description: Bad request
 *      500:
 *        description: Server error
 */
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handler function to convert image
async function convertImage(req, res) {
    if (!req.file || !req.body.format) {
        return res.status(400).json({ message: "Bad request: Image and format are required" });
    }

    try {
        const format = req.body.format;
        // Convert image using sharp
        const convertedBuffer = await sharp(req.file.buffer)
            .toFormat(format)
            .toBuffer();

        // Convert to Base64 string
        const imageBase64 = convertedBuffer.toString('base64');
        const imageResponse = `data:image/${format};base64,${imageBase64}`;

        res.status(200).json({ image: imageResponse });
    } catch (error) {
        console.error('Error converting image:', error);
        res.status(500).json({ message: 'Server error during image conversion' });
    }
}

router.post('/convertImage', upload.single('image'), convertImage);

export default router;
