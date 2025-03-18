import express from "express";
import axios from "axios";

const app = express();
app.use(express.json()); // Parse JSON requests

const OWNERREZ_API_KEY = "your_ownerrez_api_key"; // Replace with actual API key

app.get("/", async (req, res) => {
  res.send("Hello I am node js ");
});

// Webhook to receive booking data from ManyChat
app.post("/webhook", async (req, res) => {
  try {
    // const { name, email, check_in, check_out, guests } = req.body;

    // if (!name || !email || !check_in || !check_out || !guests) {
    //   return res.status(400).json({ error: "Missing required fields" });
    // }

    console.log("Received data from ManyChat:", req.body);

    // // 🔹 Call OwnerRez API to generate a booking inquiry link
    // const ownerRezResponse = await axios.post(
    //   "https://api.ownerrez.com/v1/inquiries",
    //   {
    //     name,
    //     email,
    //     arrival: check_in,
    //     departure: check_out,
    //     adults: guests,
    //   },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       "X-Api-Key": OWNERREZ_API_KEY,
    //     },
    //   }
    // );

    // // Extract inquiry link from OwnerRez response
    // const inquiryLink =
    //   ownerRezResponse.data.inquiryUrl || "https://yourfallbackurl.com";

    // console.log("Generated Inquiry Link:", inquiryLink);

    // 🔹 Send response back to ManyChat with the booking link
    // return res.json({
    //   text: `✅ Here is your booking link: ${inquiryLink}`,
    // });
    return res.status(200).send({});
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook running on port ${PORT}`));
