const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
require('dotenv').config();
const crypto = require('crypto')

const app = express();
const PORT = process.env.PORT || 5000; // Default to 5000 if .env is missing

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Check if Razorpay API keys are available
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
    console.error('❌ ERROR: Razorpay API keys are missing! Check your .env file.');
    process.exit(1);
}

app.post('/orders', async (req, res) => {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID, // Fixed case inconsistency
            key_secret: process.env.RAZORPAY_SECRET
        });

        const options = req.body;

        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).json({ error: 'Failed to create order' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/orders/validate', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`)

    const digest = sha.digest('hex')
    if (digest != razorpay_signature) {
        return res.status(400).json({ msg: 'Transaction is nor legit' })

    }
    res.json({
        msg: "Success",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
    })

})

