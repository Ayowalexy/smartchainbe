import asyncHandler from "express-async-handler";
import User from "../models/usermodel.js";
import { signupscchema, loginSchema, emailSchema, otpSchema, passwordSchema } from "../utils/schema.js";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import otpGenerator from 'otp-generator'

const { sign, verify } = jwt;



const signUp = asyncHandler(async( req, res ) => {

    console.log(req.body)
    const { error, value } = signupscchema.validate(req.body);

    if (error) {
        return res
            .status(401)
            .json(
                {
                    status: "error",
                    message: "invalid request",
                    meta: {
                        error: error.message
                    }
                })
    }

    const hash = await bcrypt.hashSync(value.password, 12);
    const user = new User({ ...value, password: hash });
    await user.save();
    res
        .status(201)
        .json(
            {
                status: "success",
                message: "user created scuccessfully",
                meta: {}
            })
})


const loginUser = asyncHandler(async (req, res) => {

    const { error, value } = loginSchema.validate(req.body);

    if (error) {
        return res
            .status(401)
            .json(
                {
                    status: "error",
                    message: "invalid request",
                    meta: {
                        error: error.message
                    }
                })
    }

    const user = await User.findOne({ email: value.email })

    if (user) {
        const match = await bcrypt.compareSync(value.password, user.password);

        if (match) {
            const token = sign({ email: user.email }, process.env.SECRET)

            res
                .status(200)
                .json(
                    {
                        email: user.email,
                        token: token,
                        status: "success",
                        meta: {}
                    })
        } else {
            res
                .status(401)
                .json(
                    {
                        status: "error",
                        message: 'invalid request',
                        meta: {
                            error: 'Email of password is incorrect'
                        }
                    })
        }

    } else {
        res.status(401).json({ "status": "error", "message": "invalid error", "meta": { "error": "user does not exist" } })
    }
})


const getPasswordResetToken = asyncHandler(async (req, res) => {

    const { error, value } = emailSchema.validate(req.body)
    if (error) {
        return res
            .status(401)
            .json(
                {
                    status: "error",
                    message: "invalid request",
                    meta: {
                        error: error.message
                    }
                })
    }

    const user = await User.findOne({ email: value.email });
    if (user) {
        const API_KEY = process.env.SG_API;

        sgMail.setApiKey(API_KEY);
        const otp = otpGenerator.generate(6, { digits: true, specialChars: false })

        const capitalizeOtp = otp.toString().toUpperCase();

        const signedToken = sign({ capitalizeOtp }, process.env.SECRET, {
            expiresIn: 60 * 2,
        })

        user.otpToken = signedToken;

        await user.save();

        const name = user.firstName.concat(' ', user.lastName)

        const message = {
            to: user.email,
            from: {
                name: "Avance Support Team",
                email: "goldenimperialswifttech@gmail.com"
            },
            text: "Hello Sample text",
            subject: "Verify OTP",
            html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                    <div style="margin:50px auto;width:70%;padding:20px 0">
                        <div style="border-bottom:1px solid #eee">
                        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Avance</a>
                        </div>
                        <p style="font-size:1.1em">Hi ${name},</p>
                        <p>Thank you for choosing Avance. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
                        <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${capitalizeOtp}</h2>
                        <p style="font-size:0.9em;">Regards,<br />Avance</p>
                        <hr style="border:none;border-top:1px solid #eee" />
                        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                        <p>Avance Inc</p>
                        <p>Lagos, Nigeria</p>
                        </div>
                    </div>
                    </div>`
        }

        sgMail.send(message)
            .then(res => {
                // console.log(res)
            })
            .catch(err => {
                console.og(err)
            })

        res
            .status(201)
            .json(
                {
                    status: "success",
                    message: "email sent scuccessfully",
                    meta: {}
                })
    } else {
        res
            .status(401)
            .json(
                {
                    status: "error",
                    message: "invalid request",
                    meta: { error: "email does not exist" }
                })
    }
})



const verifyOtp = asyncHandler(async (req, res) => {

    const { error, value } = otpSchema.validate(req.body);
    if (error) {
        return res
            .status(401)
            .json(
                {
                    status: "error",
                    message: "invalid request",
                    meta: {
                        error: error.message
                    }
                })
    }
    const user = await User.findOne({ email: value.email });

    if (user) {
        const otpToken = user.otpToken;

        try {
            const decoded = verify(otpToken, process.env.SECRET);
            if (value.otp === decoded.capitalizeOtp) {
                user.canResetPassword = true;
                await user.save();
                res
                    .status(200)
                    .json(
                        {
                            status: "success",
                            message: "OTP verified scuccessfully",
                            meta: {}
                        })
            } else {
                res.status(401)
                    .json(
                        {
                            status: "error",
                            message: "invalid request",
                            meta: {
                                error: "OTP does match"
                            }
                        })
            }
        } catch (e) {
            return res
                .status(404)
                .json(
                    {
                        status: "error",
                        message: "invalid request",
                        meta: {
                            error: "OTP has exprired"
                        }
                    })
        }


    } else {
        res
            .status(401)
            .json(
                {
                    status: "error",
                    message: "invalid request",
                    meta: { error: "email does not exist" }
                })
    }

})


const resetPassword = asyncHandler(async (req, res) => {

    const { error, value } = passwordSchema.validate(req.body)
    if (error) {

        return res
            .status(401)
            .json(
                {
                    status: "error",
                    message: "invalid request",
                    meta: {
                        error: error.message
                    }
                })
    }

    const user = await User.findOne({ email: value.email });

    if (user) {
        if (user.canResetPassword) {
            const hash = await bcrypt.hashSync(value.password, 12);
            user.password = hash;
            user.canResetPassword = false;
            await user.save();
            res
                .status(200)
                .json(
                    {
                        status: "success",
                        message: "password changed scuccessfully",
                        meta: {}
                    })
        } else {
            res
                .status(401)
                .json(
                    {
                        status: "error",
                        message: "invalid request",
                        meta: {
                            error: "You need to verify your email address first"
                        }
                    })
        }
    } else {
        res
            .status(401)
            .json(
                {
                    status: "error",
                    message: "invalid request",
                    meta: {
                        error: 'User does not exist'
                    }
                })
    }
})

export {
    signUp,
    loginUser,
    getPasswordResetToken,
    verifyOtp,
    resetPassword
}