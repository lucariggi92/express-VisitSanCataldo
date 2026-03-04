import express from "express";
import contentController from "../controllers/contentController.js"

const router = express.Router();

router.get("/", contentController.indexContent );
router.get("/:slug", contentController.showContent)
export default router;
