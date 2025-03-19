import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json()); // Parse JSON requests

const OWNERREZ_API_KEY = process.env.OWNERREZ_API_KEY; // Store API key in .env

// Function to create a guest in OwnerRez
const createGuest = async (
  first_name,
  last_name,
  email,
  phone,
) => {
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
          "X-Api-Key": OWNERREZ_API_KEY,
        },
      }
    );

    return response.data.guestId; // Return Guest ID
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
  Pets
) => {
  try {
    const quotePayload = {
      GuestId: guestId,
      Arrival: checkInDate,
      Departure: checkOutDate,
      Adults: guests,
      Children: guests,
      PropertyId: PropertyId,
      Children: Children || 0,
      Pets: Pets || 0,
    };

    const response = await axios.post(
      "https://app.ownerrez.com/api/quotes",
      quotePayload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": OWNERREZ_API_KEY,
        },
      }
    );

    return response.data; // Return Inquiry Link
  } catch (error) {
    console.error("Error creating inquiry:", error.response?.data || error);
    throw new Error("Failed to create inquiry");
  }
};

// Function to process the webhook request
const processWebhook = async (req, res) => {
  try {
    const { first_name="Hello", last_name="world", custom_fields } = req.body;

    // if (
    //   !custom_fields ||
    //   !custom_fields["Check in Date"] ||
    //   !custom_fields["Check Out Date"]
    // ) {
    //   return res
    //     .status(400)
    //     .json({ error: "Missing check-in/check-out dates" });
    // }

    const checkInDate = custom_fields["Check in Date"];
    const checkOutDate = custom_fields["Check Out Date"];
    const guests = custom_fields["Adults"] || 1; // Default to 1 adult if not provided
    const email = custom_fields["Email"] || "no-email@example.com";
    const phone = custom_fields["Phone"] || "N/A";

    console.log("Received booking request from ManyChat:", req.body);

    // Step 1: Create Guest
    const guestId = await createGuest(
      first_name,
      last_name,
      email,
      phone,
    );
    console.log("Guest Created Successfully with ID:", guestId);

    // Step 2: Create Inquiry
    const inquiryLink = await createQuote(
      checkInDate,
      checkOutDate,
      guests,
      guestId
    );
    console.log("Generated Quote Link:", inquiryLink);

    // Step 3: Send response back to ManyChat
    return res.json({
      text: `✅ Hi ${first_name}, here is your booking link: ${inquiryLink}`,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Webhook route
app.post("/webhook/createInquiry", processWebhook);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook running on port ${PORT}`));
