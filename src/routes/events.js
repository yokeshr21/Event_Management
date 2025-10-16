import express from "express";
import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import { createEventValidation, createUserValidation } from "../utils/validators.js";
import { validationResult } from "express-validator";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};


router.post("/users", createUserValidation, validate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const id = uuidv4();
    await pool.query("INSERT INTO users (id, name, email) VALUES ($1,$2,$3)", [id, name, email]);
    res.status(201).json({ message: "User created", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User creation failed" });
  }
});

router.post("/events", createEventValidation, validate, async (req, res) => {
  try {
    const { title, event_datetime, location, capacity } = req.body;
    const id = uuidv4();
    await pool.query(
      "INSERT INTO events (id, title, event_datetime, location, capacity) VALUES ($1,$2,$3,$4,$5)",
      [id, title, event_datetime, location, capacity]
    );
    res.status(201).json({ message: "Event created", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Event creation failed" });
  }
});


router.post("/events/:eventId/register", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    
    const user = await pool.query("SELECT * FROM users WHERE id=$1", [userId]);
    if (user.rowCount === 0) return res.status(404).json({ error: "User not found" });

    
    const event = await pool.query("SELECT * FROM events WHERE id=$1", [eventId]);
    if (event.rowCount === 0) return res.status(404).json({ error: "Event not found" });

    
    if (new Date(event.rows[0].event_datetime) < new Date())
      return res.status(400).json({ error: "Cannot register for past events" });

    
    const count = await pool.query("SELECT COUNT(*) FROM event_registrations WHERE event_id=$1", [
      eventId,
    ]);
    if (parseInt(count.rows[0].count) >= event.rows[0].capacity)
      return res.status(400).json({ error: "Event is full" });

    
    const existing = await pool.query(
      "SELECT * FROM event_registrations WHERE event_id=$1 AND user_id=$2",
      [eventId, userId]
    );
    if (existing.rowCount > 0) return res.status(400).json({ error: "Already registered" });

    
    const regId = uuidv4();
    await pool.query("INSERT INTO event_registrations (id, event_id, user_id) VALUES ($1,$2,$3)", [
      regId,
      eventId,
      userId,
    ]);

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});


router.get("/events/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await pool.query("SELECT * FROM events WHERE id=$1", [eventId]);
    if (event.rowCount === 0) return res.status(404).json({ error: "Event not found" });

    const users = await pool.query(
      `SELECT u.id, u.name, u.email, er.registered_at
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1
       ORDER BY er.registered_at ASC`,
      [eventId]
    );

    res.json({
      ...event.rows[0],
      registered_users: users.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event details" });
  }
});


router.delete("/events/:eventId/cancel", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    const check = await pool.query(
      "SELECT * FROM event_registrations WHERE event_id=$1 AND user_id=$2",
      [eventId, userId]
    );
    if (check.rowCount === 0)
      return res.status(400).json({ error: "User is not registered for this event" });

    await pool.query("DELETE FROM event_registrations WHERE event_id=$1 AND user_id=$2", [
      eventId,
      userId,
    ]);

    res.json({ message: "Registration cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel registration" });
  }
});


router.get("/events/upcoming", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events WHERE event_datetime > now()");
    const events = result.rows.sort((a, b) => {
      const dateA = new Date(a.event_datetime);
      const dateB = new Date(b.event_datetime);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return a.location.localeCompare(b.location);
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list events" });
  }
});


router.get("/events/:eventId/stats", async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await pool.query("SELECT * FROM events WHERE id=$1", [eventId]);
    if (event.rowCount === 0) return res.status(404).json({ error: "Event not found" });

    const count = await pool.query(
      "SELECT COUNT(*)::int AS total FROM event_registrations WHERE event_id=$1",
      [eventId]
    );

    const totalRegistrations = count.rows[0].total;
    const capacity = event.rows[0].capacity;
    const remaining = capacity - totalRegistrations;
    const percentageUsed = ((totalRegistrations / capacity) * 100).toFixed(2);

    res.json({
      event_id: eventId,
      total_registrations: totalRegistrations,
      remaining_capacity: remaining,
      percentage_used: `${percentageUsed}%`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event stats" });
  }
});

export default router;
