const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ImageAnnotatorClient } = require('@google-cloud/vision');

const app = express();
const port = process.env.PORT || 3000; // Use the PORT environment variable if available

// Use cors middleware to enable CORS
app.use(cors());

// Set up middleware
app.use(bodyParser.json({ limit: '10mb' }));

// Provide the path to your service account key file
const keyFilePath = '/etc/secrets/CRED.json';

// Instantiate the ImageAnnotatorClient with the key file path
const visionClient = new ImageAnnotatorClient({ keyFilename: keyFilePath });
// Endpoint for processing images
app.post('/process-image', async (req, res) => {
    const base64Image = req.body.image.replace(/^data:image\/png;base64,/, '');

    try {
        // Call Google Cloud Vision API for text detection
        const [result] = await visionClient.textDetection(Buffer.from(base64Image, 'base64'), {
            imageContext: {
                // Add features array for text detection and document text detection
                // This will attempt both types of text detection
                features: [
                    { type: 'TEXT_DETECTION' },
                    { type: 'DOCUMENT_TEXT_DETECTION' },
                ],
            },
        });

        // Extract detected text from the result
        let detectedText = '';
        if (result.textAnnotations && result.textAnnotations.length > 0) {
            detectedText = result.textAnnotations[0].description;
        }

        // Send the detected text back to the client
        res.json({ result: detectedText });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
