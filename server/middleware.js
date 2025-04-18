import jwt from "jsonwebtoken";

const validateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("Authorization header missing or malformed.");
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        console.error("Error verifying token:", error.message);
        return res.status(401).json({ msg: "Invalid token", error: error.message });
    }
};

export default validateToken;
