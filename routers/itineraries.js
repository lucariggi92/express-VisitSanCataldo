import express from "express";
import {indexItinerary, showItinerary} from "../controllers/itineraryController.js"

const router = express.Router();

router.get("/", indexItinerary );
router.get("/:slug", showItinerary)
export default router;

