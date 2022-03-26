import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import Storage from './helpers/storage';
import S3 from 'aws-sdk/clients/s3';

dotenv.config();

const app: Application = express();

// Set S3 endpoint
const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
});

app.use(cors());

app.use('/media', express.static('public'));

// setup a new instance of the AvatarStorage engine
const storage = Storage({
  s3,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: 'public-read',
  threshold: 1000,
  output: 'jpg',
});

const limits = {
  files: 1, // allow only 1 file per request
  fileSize: 5 * (1024 * 1024), // 10 MB (max file size)
};

// setup multer
const upload = multer({
  storage,
  limits: limits,
});

interface CustomFileResult extends Partial<Express.Multer.File> {
  image: string;
  placeholder: string;
  bucket?: string;
}

app.post('/upload', upload.single('photo'), function (req, res) {
  const file = req.file as CustomFileResult;
  const { mimetype, originalname, image, placeholder, bucket } = file;
  res.json({ mimetype, originalname, image, placeholder, bucket });
});

const PORT = 5000;

app.listen(PORT, function () {
  console.log(`Express Server started on port ${PORT}`);
});
