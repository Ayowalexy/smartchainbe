import Joi from 'joi';


const signupscchema = Joi.object({
    firstName: Joi
        .string()
        .required(),
    lastName: Joi
        .string()
        .required(),
    password: Joi
        .string()
        .required(),
    email: Joi
        .string()
        .email()
        .required(),
})

const loginSchema = Joi.object({
   
    password: Joi
        .string()
        .required(),
    email: Joi
        .string()
        .email()
        .required(),
})

const emailSchema = Joi.object({
    email: Joi
        .string()
        .email()
        .required(),
})

const otpSchema = Joi.object({
    otp: Joi
        .string()
        .required(),
    email: Joi
        .string()
        .email()
        .required()
})

const passwordSchema = Joi.object({
    password: Joi
        .string()
        .required(),
    email: Joi
        .string()
        .email()
        .required()
})


export {
    signupscchema,
    loginSchema,
    emailSchema,
    otpSchema,
    passwordSchema
}