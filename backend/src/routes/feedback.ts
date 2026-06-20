import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { handleSaveFeedback } from "../controllers/feedback";

const router = Router();

router.post("/", authenticate, handleSaveFeedback);

export default router as import("express").Router;
