# Node.js Course Project

This project uses Express.js to build an online shop website.

This project uses MongoDB as the database and works with Mongoose to interact with the server.

In addition to basic authentication functions, this website can also implement:

* For authorized administrators, they can publish, update and delete their own products;

* For authenticated visitors, they can view published products and details, add them to cart, and checkout to create an order based on the cart.

As for the realization of specific functions in the website:

* This project uses [SendGrid](www.sendgrid.com) to notify visitors through emails when they sign up or require password resetting;

* This projects uses [Stripe](www.stripe.com) to process online payments.
