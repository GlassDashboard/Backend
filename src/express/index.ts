// Initialize express, load in middleware, routes, and handle the rest api
import express, { Request } from "express";
export const app = express();

// Implement security middleware
import helmet from "helmet";
app.use(helmet());

import ratelimit from "./middleware/ratelimit";
app.use(ratelimit(300, "2m", false, ["/panel/"]));

import cors from "cors";
app.use(cors({ origin: process.env.CORS_URL, credentials: true }));

// Implement extra middleware
import fileUpload from "express-fileupload";
app.use(
  fileUpload({
    // We're limited by Cloudflare regardless for uploading
    limits: { fileSize: 100 * 1024 * 1024 },
  })
);

// Attach express server
import { createServer } from "../http";
createServer(app);

// Start routing express
import { router as v1Router } from "./api/v1";
import { FileData } from "../ftp/utils";

export const start = async () => {
  console.log("Starting Express Web Server...");
  app.use("/v1", v1Router);
};

// Attached Information
export interface FileRequest extends Request {
  files: {
    file: ExpressFile | ExpressFile[];
  };
}

export interface ExpressFile {
  name: string;
  data: Buffer;
  size: Number;
  encoding: string;
  mimetype: string;
  md5: string;
}
