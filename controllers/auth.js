const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');

const transporter = nodemailer.createTransport(
    sendgridTransport({
        auth: {
            api_key:
                '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',
        },
    })
);

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
        },
        validationErrors: [],
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
            },
            validationErrors: errors.array(),
        });
    }
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pageTitle: 'Login',
                    path: '/login',
                    errorMessage: 'Invalid email or password.',
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationErrors: [
                        { param: 'email' },
                        { param: 'password' },
                    ],
                });
            }
            bcrypt
                .compare(password, user.password)
                .then((doMatch) => {
                    if (doMatch) {
                        req.session.user = user;
                        req.session.isLoggedIn = true;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    res.status(422).render('auth/login', {
                        pageTitle: 'Login',
                        path: '/login',
                        errorMessage: 'Invalid email or password.',
                        oldInput: {
                            email: email,
                            password: password,
                        },
                        validationErrors: [
                            { param: 'email' },
                            { param: 'password' },
                        ],
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.redirect('/login');
                });
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: '',
        },
        validationErrors: [],
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            pageTitle: 'Signup',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword,
            },
            validationErrors: errors.array(),
        });
    }
    bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] },
            });
            return user.save();
        })
        .then(() => {
            res.redirect('/login');
            // return transporter.sendMail({
            //     to: email,
            //     from: 'chdzhang@umich.edu',
            //     subject: 'Signup Succeeded!',
            //     html: '<h1>You successfully signed up!</h1>',
            // });
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message,
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(() => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'chdzhang@umich.edu',
                    subject: 'Password Reset',
                    html: `
                        <p>You requested a password reset.</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                    `,
                });
            })
            .catch((err) => {
                console.log(err);
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
    })
        .then((user) => {
            if (!user) {
                req.flash('error', 'Reset link expired or does not exist!');
                return res.redirect('/reset');
            }
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                pageTitle: 'New Password',
                path: '/new-password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token,
            });
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId,
    })
        .then((user) => {
            if (!user) {
                req.flash('error', 'Reset link expired or does not exist!');
                return res.redirect('/reset');
            }
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then((hashedPassword) => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(() => {
            res.redirect('/login');
        })
        .catch((err) => {
            console.log(err);
        });
};
