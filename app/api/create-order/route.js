// app/api/create-order/route.js
import { NextRequest } from 'next/server';
import { getUserFromAuthHeader } from '../../../lib/auth.js';

// Razorpay SDK imports
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

export async function POST(request) {
    try {
        // Authentication check
        const user = getUserFromAuthHeader(request.headers.get('authorization'));
        if (!user) {
            return Response.json({ error: 'Invalid or missing authentication' }, { status: 401 });
        }

        const { carId, pickupTime, returnTime, plan, discount = 0 } = await request.json();

        // Validate required parameters
        if (!carId || !pickupTime || !returnTime || !plan) {
            return Response.json({
                error: 'carId, pickupTime, returnTime, and plan are required'
            }, { status: 400 });
        }

        // Validate discount parameter
        const discountAmount = parseFloat(discount) || 0;
        if (discountAmount < 0 || discountAmount > 50000) { // Max 50k discount
            return Response.json({ error: 'Invalid discount amount' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // 1. Fetch vehicle details and pricing from database
        const vehicleResponse = await fetch(
            `${supabaseUrl}/rest/v1/vehicles?id=eq.${carId}&select=*`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': request.headers.get('authorization'),
                },
            }
        );

        if (!vehicleResponse.ok) {
            throw new Error('Failed to fetch vehicle details');
        }

        const vehicles = await vehicleResponse.json();
        if (vehicles.length === 0) {
            return Response.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        const vehicle = vehicles[0];

        // 2. Parse and validate dates
        const startDate = new Date(pickupTime);
        const endDate = new Date(returnTime);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return Response.json({ error: 'Invalid date format' }, { status: 400 });
        }

        if (endDate <= startDate) {
            return Response.json({ error: 'Return time must be after pickup time' }, { status: 400 });
        }

        // 3. Calculate pricing server-side (same logic as client but on server)
        const diffMs = endDate - startDate;
        const hours = Math.ceil(diffMs / 3600000);

        // Get pricing from database (server-side calculation)
        const hourlyRate = parseFloat(vehicle.hourly_rate) || 0;

        let insuranceCost;
        switch (plan?.toUpperCase()) {
            case 'MAX':
                insuranceCost = parseFloat(vehicle.price_max) || 0;
                break;
            case 'PLUS':
                insuranceCost = parseFloat(vehicle.price_plus) || 0;
                break;
            case 'BASIC':
            default:
                insuranceCost = parseFloat(vehicle.price_basic) || 60;
                break;
        }

        const rentalCost = +(hours * hourlyRate).toFixed(2);
        const basePrice = +(rentalCost + insuranceCost).toFixed(2);
        const gst = +(basePrice * 0.18).toFixed(2);
        const convFee = 100; // Fixed convenience fee
        const subtotal = +(basePrice + gst + convFee).toFixed(2);

        // Apply discount
        const total = Math.max(0, +(subtotal - discountAmount).toFixed(2));

        // 4. Validate calculated prices (sanity checks)
        if (total <= 0 || total > 100000) { // Max 1 lakh INR
            return Response.json({ error: 'Invalid calculated price' }, { status: 400 });
        }

        // 5. Create Razorpay order with server-calculated amount
        const orderOptions = {
            amount: Math.round(total * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `booking_${carId}_${Date.now()}`,
            notes: {
                vehicle_id: carId.toString(),
                user_id: user.sub,
                plan: plan,
                hours: hours.toString(),
                pickup_time: pickupTime,
                return_time: returnTime,
                discount: discountAmount.toString(),
                subtotal: subtotal.toString(),
                calculated_total: total.toString()
            }
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);

        // 6. Return order details to client
        return Response.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: total,
            currency: 'INR',
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            pricing: {
                hours,
                hourlyRate,
                rentalCost,
                insuranceCost,
                basePrice,
                gst,
                convFee,
                subtotal,
                discount: discountAmount,
                total,
                plan
            },
            vehicle: {
                id: vehicle.id,
                make: vehicle.make,
                model: vehicle.model,
                model_year: vehicle.model_year
            }
        });

    } catch (error) {
        console.error('Error creating order:', error);
        return Response.json({
            error: 'Failed to create payment order',
            details: error.message
        }, { status: 500 });
    }
}