const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");
const Product = require("./models/Product");
const { seedTestimonialsIfEmpty } = require("./utils/seedTestimonials");

/** Backfill hasImage / hasVideo for older documents (avoids loading Buffers in list queries). */
async function migrateProductMediaFlags() {
  try {
    await Product.collection.updateMany(
      {},
      [
        {
          $set: {
            hasImage: {
              $or: [
                {
                  $and: [
                    { $eq: [{ $type: "$imageData" }, "binData"] },
                    { $gt: [{ $binarySize: "$imageData" }, 0] },
                  ],
                },
                {
                  $and: [
                    { $eq: [{ $type: "$image" }, "string"] },
                    { $regexMatch: { input: "$image", regex: "^/uploads/" } },
                  ],
                },
              ],
            },
            hasVideo: {
              $and: [
                { $eq: [{ $type: "$videoData" }, "binData"] },
                { $gt: [{ $binarySize: "$videoData" }, 0] },
              ],
            },
          },
        },
      ],
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("migrateProductMediaFlags:", err.message);
  }
}

async function bootstrap() {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is missing in environment variables.");
  }

  await connectDB();
  await seedTestimonialsIfEmpty();
  await migrateProductMediaFlags();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start backend:", err.message);
  process.exit(1);
});
