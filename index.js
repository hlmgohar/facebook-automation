import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import base64 from "base-64";

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json()); // Parse JSON requests

// Get OwnerRez credentials from .env file
const OWNERREZ_USERNAME = process.env.OWNERREZ_USERNAME;
const OWNERREZ_PASSWORD = process.env.OWNERREZ_PASSWORD;

// Encode credentials for Basic Auth
const basicAuth = `Basic ${base64.encode(
  `${OWNERREZ_USERNAME}:${OWNERREZ_PASSWORD}`
)}`;

// Function to create a guest in OwnerRez
const createGuest = async (first_name, last_name, email, phone) => {
  try {
    const guestPayload = {
      first_name,
      last_name,
      email_addresses: [{ address: email, is_default: true, type: "home" }],
      phones: [{ number: phone, is_default: true, type: "mobile" }],
      notes: "Created via ManyChat webhook",
      opt_out_marketing_email: false,
      opt_out_marketing_sms: false,
      opt_out_transactional_sms: false,
    };

    const response = await axios.post(
      "https://api.ownerrez.com/v2/guests",
      guestPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuth, // Use Basic Auth
        },
      }
    );

    return response.data.id; // Return Guest ID
  } catch (error) {
    console.error("Error creating guest:", error.response?.data || error);
    throw new Error("Failed to create guest");
  }
};

// Function to create an inquiry in OwnerRez
const createQuote = async (
  checkInDate,
  checkOutDate,
  guests,
  guestId,
  Children,
  Pets,
  PropertyId
) => {
  try {
    const quotePayload = {
      GuestId: guestId,
      Arrival: checkInDate,
      Departure: checkOutDate,
      Adults: guests,
      Children: Children || 0,
      Pets: Pets || 0,
      PropertyId: PropertyId || 448447, // Ensure PropertyId is provided
    };

    const response = await axios.post(
      "https://api.ownerrez.com/v1/quotes",
      quotePayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuth, // Use Basic Auth
        },
      }
    );

    return response.data; // Return Inquiry Link
  } catch (error) {
    console.error("Error creating inquiry:", error.response?.data || error);
    throw new Error("Failed to create inquiry");
  }
};

const getListProperties = async () => {
  try {
    const response = await axios.get("https://api.ownerrez.com/v2/properties", {
      headers: {
        "Content-Type": "application/json",
        Authorization: basicAuth, // Use Basic Auth
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating inquiry:", error.response?.data || error);
    throw new Error("Failed to create inquiry");
  }
};

// Function to create an inquiry in OwnerRez
const createInquiry = async (req, res) => {
  try {
    const {
      first_name = "John",
      last_name = "Doe",
      email = "johndoe@example.com",
      phone = "123-456-7890",
      checkInDate = new Date().toISOString().split("T")[0], // Default to today's date
      checkOutDate = new Date(Date.now() + 86400000)
        .toISOString()
        .split("T")[0], // Default to tomorrow
      guests = 1, // Default to 1 adult
    } = req.body;

    const inquiryPayload = {
      name: `${first_name} ${last_name}`,
      email,
      phone,
      arrival: checkInDate,
      departure: checkOutDate,
      adults: guests,
    };

    const ownerRezResponse = await axios.post(
      "https://api.ownerrez.com/v1/inquiries",
      inquiryPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuth, // Use Basic Auth
        },
      }
    );

    return res
      .status(200)
      .json({ type: "SUCCESS", data: ownerRezResponse.data });
  } catch (error) {
    console.error("Error creating inquiry:", error.response?.data || error);
    return res
      .status(500)
      .json({ type: "ERROR", message: "Failed to create inquiry" });
  }
};

// Function to process the webhook request
const processWebhook = async (req, res) => {
  try {
    const {
      first_name = "Hello",
      last_name = "world",
      custom_fields,
    } = req.body;

    const checkInDate = custom_fields["Check in Date"];
    const checkOutDate = custom_fields["Check Out Date"];
    const guests = custom_fields["Adults"] || 1; // Default to 1 adult if not provided
    const email = custom_fields["Email"] || "no-email@example.com";
    const phone = custom_fields["Phone"] || "+44 7723 476354";
    const propertyId = custom_fields["Property ID"] || 450490;
    const children = custom_fields["Children"] || 0;
    const pets = custom_fields["Pets"] || 0;

    console.log("Received booking request from ManyChat:", req.body);

    // Step 1: Create Guest
    const guestId = await createGuest(first_name, last_name, email, phone);
    console.log("Guest Created Successfully with ID:", guestId);

    // Step 2: Create Inquiry
    const quoteLink = await createQuote(
      checkInDate,
      checkOutDate,
      guests,
      guestId,
      children,
      pets,
      propertyId
    );
    console.log("Generated Quote Link:", quoteLink);

    // Step 3: Send response back to ManyChat
    return res.json({
      text: `✅ Hi ${first_name}, here is your booking link: ${quoteLink}`,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getProperties = async (req, res) => {
  try {
    const properties = await getListProperties();
    return res.json({
      properties,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Webhook route
app.post("/webhook/createQuotes", processWebhook);
app.get("/list/properties", getProperties);
app.post("/webhook/createInquiry", createInquiry);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook running on port ${PORT}`));
