import express from "express";
import itineraryController from "../controllers/itineraryController.js"

const router = express.Router();

router.get("/", itineraryController.indexItineraray );
router.get("/:slug", itineraryController.showItinerary)
export default router;

