// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const session = require("express-session");
// const passport = require("./config/passport.js");

// // import routes
// const authRoute = require("./routes/authRoute.js");
// const userRoute = require("./routes/userRoute.js");
// const adminRoute = require("./routes/adminRoute.js");
// const leadRoutes = require("./routes/leadRoutes.js");
// const programRoutes = require("./routes/programRoutes.js");
// const blogRoutes = require("./routes/blogRoute.js");
// const connectDB = require("./config/db.js");

// const app = express();

// // Middlewares
// app.use(express.json());

// app.use(
//   cors({
//   origin: [
//     "http://localhost:3000",
//     "http://localhost:3001",
//     "https://alco-crm-frontend.vercel.app",
//     "https://alco-cms-website.vercel.app",
//   ],
//   credentials: true,
//   })
// );

// // Session — passport se pehle hona chahiye
// app.use(
//   session({
//   secret: process.env.SESSION_SECRET || "secret",
//   resave: false,
//   saveUninitialized: false,
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// app.use(async (req, res, next) => {
//   await connectDB();
//   next();
// });

// // Routes
// app.use("/api/auth", authRoute);
// app.use("/api/users", userRoute);
// app.use("/api/admin", adminRoute);
// app.use("/api/v1/leads", leadRoutes);
// app.use("/api/v1/programs", programRoutes);
// app.use("/api/v1/blogs", blogRoutes);

// app.get("/", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "ALCO CRM Backend Running Successfully 🚀",
//   });
// });

// // mongoose
// //   .connect(process.env.ATLAS_URL, {
// //   serverSelectionTimeoutMS: 30000,
// //   socketTimeoutMS: 45000
// //   })
// //   .then(() => {
// //   console.log("✅ Database Connected Successfully");
// //   if (process.env.NODE_ENV !== "production") {
// //     app.listen(process.env.PORT || 5000, () => {
// //       console.log(`🚀 Server running on http://localhost:${process.env.PORT || 5000}`);
// //     });
// //   }
// // }).catch((err) => {
// //   console.error("❌ Database connection error:", err.message);
// // });
// connectDB()
//   .then(() => {
//     console.log("✅ Database Connected");

//     if (process.env.NODE_ENV !== "production") {
//       app.listen(process.env.PORT || 5000, () => {
//         console.log(
//           `🚀 Server running on http://localhost:${process.env.PORT || 5000}`
//         );
//       });
//     }
//   })
//   .catch((err) => console.error("❌ DB Error:", err));

// module.exports = app;
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
require("./jobs/payment/paymentCron.js");

const passport = require("./config/passport.js");

// Routes
const authRoute = require("./routes/authRoute.js");
const userRoute = require("./routes/userRoute.js");
const adminRoute = require("./routes/adminRoute.js");
const enrollmentRoute  = require("./routes/enrollmentRoute.js");
const financeRoute   = require("./routes/financeRoute.js");
const accessRoute = require("./routes/accessRoute.js")
const leadRoute = require("./routes/leadRoute.js");
const programRoute = require("./routes/programRoute.js");
const auditRoute = require("./routes/auditRoute.js");
const blogRoute = require("./routes/blogRoute.js");


const connectDB = require("./config/db.js");

const app = express();

// ✅ STEP 1: CORS FIRST — sabse zaroori
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://alco-crm-frontend.vercel.app",
    "https://alco-cms-website.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight requests handle karo

// ✅ STEP 2: Body parser AFTER cors
app.use(express.json());

// ✅ STEP 3: Session & Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ✅ STEP 4: DB Middleware WITH error handling
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB Middleware Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Database connection error",
    });
  }
});

// ✅ Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/v1/enrollments", enrollmentRoute);
app.use("/api/v1/finance", financeRoute);
app.use("/api/v1/access", accessRoute);
app.use("/api/v1/leads", leadRoute);
app.use("/api/v1/programs", programRoute);
app.use("/api/v1/audit-logs", auditRoute);
app.use("/api/v1/blogs", blogRoute);
app.use('/api/webinars', require('./routes/webinars')); 

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ALCO CRM Backend Running Successfully",
  });
});

// ✅ Server Start
connectDB()
  .then(() => {
    console.log("Database Connected");
    if (process.env.NODE_ENV !== "production") {
      app.listen(process.env.PORT || 5000, () => {
        console.log(`Server running on http://localhost:${process.env.PORT || 5000}`);
      });
    }
  })
  .catch((err) => console.error("DB Error:", err));

module.exports = app;
