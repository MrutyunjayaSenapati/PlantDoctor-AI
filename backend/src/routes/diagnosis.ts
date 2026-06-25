import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { handleDiagnose, handleHistory, handleStats } from "../controllers/diagnosis";

const router = Router();

router.post("/", authenticate, handleDiagnose);
router.get("/history", authenticate, handleHistory);
router.get("/stats", authenticate, handleStats);

export default router as import("express").Router;
