import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { handleDiagnose, handleHistory } from "../controllers/diagnosis";

const router = Router();

router.post("/", authenticate, handleDiagnose);
router.get("/history", authenticate, handleHistory);

export default router as import("express").Router;
