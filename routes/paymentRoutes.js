import express from "express";
const router = express.Router();
import { confirmPayment } from "../controllers/paymentController.js";


router.route('/').post(confirmPayment)


export default router