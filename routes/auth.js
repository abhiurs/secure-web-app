const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

const User = require("../models/user");

const router = express.Router();

router.get("/", (req, res) => {
    res.redirect("/login");
});

router.get("/signup", (req, res) => {
    res.render("signup");
});

router.post("/signup",

[
    body("username").trim().escape(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
],

async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

    return res.render("signup", {
        csrfToken: req.csrfToken(),
        error: errors.array()[0].msg
    });
}

    const { username, email, password } = req.body;

    try {

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.send("User already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        res.redirect("/login");

    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login", async (req, res) => {

    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email });

        if (!user) {
            return res.send("Invalid credentials");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.send("Invalid credentials");
        }

        req.session.user = user;

        res.redirect("/dashboard");

    } catch (err) {
        console.log(err);
        res.send("Error");
    }
});

router.get("/dashboard", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    res.render("dashboard", {
        user: req.session.user
    });
});

router.get("/logout", (req, res) => {

    req.session.destroy(() => {
        res.redirect("/login");
    });
});

module.exports = router;