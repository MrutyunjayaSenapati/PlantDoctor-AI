import { Router } from "express";
import { authenticate } from "../middleware/auth";
import upload from "../middleware/upload";
import { handleUpload } from "../controllers/upload";

const router = Router();

router.post("/", authenticate, upload.single("image"), handleUpload);

export default router as import("express").Router;
