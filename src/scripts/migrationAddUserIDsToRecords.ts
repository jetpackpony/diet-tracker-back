import { initDB } from "../db/index.js";
import { getUserByUserName } from "../db/models/index.js";

const db = await initDB();
if (db !== undefined) {
  const user = await getUserByUserName(db, "jetpackpony");
  if (user !== undefined) {
    // Add user._id to all the records
    const updateRecords = await db.collection("records")
      .updateMany(
        {},
        { $set: { userID: user._id } },
      );
    console.log(`Updated ${updateRecords.modifiedCount} documents`);

    // Add user._id to all the foodItems
    const updateFoodItems = await db.collection("foodItems")
      .updateMany(
        {},
        { $set: { userID: user._id } },
      );
    console.log(`Updated ${updateFoodItems.modifiedCount} documents`);
  } else {
    console.error(`Couldn't find user by username 'jetpackpony'`);
  }
} else {
  console.error("Couldn't establish DB connection");
}