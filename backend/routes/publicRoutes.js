import { Router } from "express";
import { getPublicReport } from "../controllers/publicController.js";

const router = Router();

router.get("/reports/:shareId", getPublicReport);

export default router;
