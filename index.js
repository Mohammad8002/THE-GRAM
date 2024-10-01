import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./server/utils/database.js";
import userRoute from "./server/routes/userRoute.js";
import postRoute from "./server/routes/postRoute.js";
import messageRoute from "./server/routes/messageRoute.js";
import { app, server } from "./server/socket/socket.js";
import path from "path";
dotenv.config({});

const __dirname = path.resolve();

const PORT =  process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));
const corsOptions = {
    origin:`http://localhost:5173`,
    credentials: true
}
app.use(cors(corsOptions));

// Here API will come.
app.use("/user", userRoute);
app.use("/post", postRoute);
app.use("/message", messageRoute);

app.use(express.static(path.join(__dirname, 'client/dist')));
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
})

app.get('/', (_, res) => {
    return res.status(200).json({
        message: "Welcome to server",
        success: true
    });
});

server.listen(PORT, () => {
    connectDB();
    console.log(`Server listen at port ${PORT}`);
})