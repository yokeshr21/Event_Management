import express from "express";
import dotenv from "dotenv";
import eventsRouter from "./routes/events.js";

dotenv.config();
const app = express();
app.use(express.json());

// Routes
app.use("/api", eventsRouter);

app.get("/", (req, res) => {
  res.send("Event Management API is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));