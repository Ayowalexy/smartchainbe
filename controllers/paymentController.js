import asyncHandler from "express-async-handler";
import User from "../models/usermodel.js";
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config();

const SECRET = process.env.P_SECRET


const confirmPayment = asyncHandler(async (req, res) => {


    const hash = crypto.createHmac('sha512', SECRET).update(JSON.stringify(req.body)).digest('hex');
    if (hash == req.headers['x-paystack-signature']) {
        const event = req.body;

        const email = event.data.customer.email;
        const amount = event.data.amount

        await User.findOneAndUpdate({
            email: email
        }, {
            walletBalance: amount
        })
    }
    res.send(200);

})


export {
    confirmPayment
}