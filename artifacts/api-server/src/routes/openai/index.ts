import { Router } from "express";
import conversationsRouter from "./conversations";
import imageRouter from "./image";
import statsRouter from "./stats";

const router = Router();

// Chat
router.use("/openai/chat", conversationsRouter);

// Images
router.use("/openai/images", imageRouter);

// Stats
router.use("/openai/stats", statsRouter);

export default router;