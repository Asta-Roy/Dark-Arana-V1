import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import authRouter from "./auth";
import ticketsRouter from "./tickets";
import uploadRouter from "./upload";
import paymobRouter from "./paymob";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use(authRouter);
router.use(ticketsRouter);
router.use(uploadRouter);
router.use(paymobRouter);

export default router;
