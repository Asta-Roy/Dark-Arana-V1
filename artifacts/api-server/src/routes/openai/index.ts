import { Router } from "express";
import conversationsRouter from "./conversations";
import imageRouter from "./image";
import statsRouter from "./stats";

const router = Router();

router.use("/openai", conversationsRouter);
router.use("/openai", imageRouter);
router.use("/openai", statsRouter);

export default router;
