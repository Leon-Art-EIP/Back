const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
    const token = req.header('x-auth-token');
    
    // Check if token exists
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Assign the user from the decoded token to the request object
        next();
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
