import app from './src/app.mjs';
import connectDB from "./src/config/db.mjs";

// Connect Database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
