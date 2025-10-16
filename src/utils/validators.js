import { body, param } from "express-validator";

export const createEventValidation = [
  body("title").isString().isLength({ min: 1 }).withMessage("Title required"),
  body("event_datetime").isISO8601().withMessage("event_datetime must be ISO8601"),
  body("location").isString().isLength({ min: 1 }).withMessage("Location required"),
  body("capacity").isInt({ min: 1, max: 1000 }).withMessage("Capacity must be 1..1000"),
];

export const createUserValidation = [
  body("name").isString().isLength({ min: 1 }).withMessage("Name required"),
  body("email").isEmail().withMessage("Valid email required"),
];

export const eventIdParam = [
  param("eventId").isUUID().withMessage("eventId must be UUID"),
];

export const userIdParam = [
  param("userId").isUUID().withMessage("userId must be UUID"),
];