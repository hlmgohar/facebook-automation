import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(express.json()); // Parse JSON requests

const OWNERREZ_API_KEY = process.env.OWNERREZ_API_KEY; // Store API key in .env

// Webhook to receive booking data from ManyChat
app.post("/webhook/createInquiry", async (req, res) => {
  try {
    const { first_name, last_name, custom_fields } = req.body;

    if (
      !custom_fields ||
      !custom_fields["Check in Date"] ||
      !custom_fields["Check Out Date"]
    ) {
      return res
        .status(400)
        .json({ error: "Missing check-in/check-out dates" });
    }

    const checkInDate = custom_fields["Check in Date"];
    const checkOutDate = custom_fields["Check Out Date"];
    const guests = custom_fields["Adults"] || 1; // Default to 1 adult if not provided
    const email = custom_fields["Email"] || "no-email@example.com";
    const phone = custom_fields["Phone"] || "N/A";

    console.log("Received booking request from ManyChat:", req.body);

    // 🔹 Call OwnerRez API to create an inquiry
    const ownerRezResponse = await axios.post(
      "https://api.ownerrez.com/v1/inquiries",
      {
        name: `${first_name} ${last_name}`,
        email,
        phone,
        arrival: checkInDate,
        departure: checkOutDate,
        adults: guests,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": OWNERREZ_API_KEY,
        },
      }
    );

    // Extract inquiry link from OwnerRez response
    const inquiryLink =
      ownerRezResponse.data.inquiryUrl || "https://yourfallbackurl.com";

    console.log("Generated Inquiry Link:", inquiryLink);

    // 🔹 Send response back to ManyChat with the booking link
    return res.json({
      text: `✅ Hi ${first_name}, here is your booking link: ${inquiryLink}`,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook running on port ${PORT}`));
