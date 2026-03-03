import express from "express";
import contentController from "../controllers/contentController.js"

const router = express.Router();

router.get("/", contentController.index );
router.get("/:slug", contentController.show)
export default router;
