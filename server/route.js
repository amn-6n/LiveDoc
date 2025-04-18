import express from "express";
import User from "./user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
import validateToken from "./middleware.js";
const router = express.Router();


router.post("/register", async (req,res) => {
    const {username, email, password} = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{username}, {email}]
        });
        if (existingUser) {
            return res.status(400).json({error: "User already exists"});
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({username, email, password: hashedPassword});
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

router.post("/login", async (req,res) => {
    const {email, password} = req.body;
    try {
        const user = await User.findOne({$or: [{username: email}, {email}]}).select("+password");
        if (!user) {
            return res.status(400).json({error: "User not found"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({error: "Invalid password"});
        }
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "1h"});
        res.status(200).json({token, user: {id: user._id, username: user.username, email: user.email}});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

router.get("/myInfo", validateToken, async (req,res) => {
    const {id} = req.user;
    try {
        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});


export default router;

