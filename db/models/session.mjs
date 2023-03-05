import { model, Schema } from "mongoose";
import { randomBytes } from "crypto";

var keyGenerator = () => {
	return randomBytes(20).toString('hex');
};

var sessionSchema = new Schema({
	userId: { type: Number, required: true },
	key: { type: String, required: true, default: keyGenerator }
});

sessionSchema.index({ userId: 1 });

model("Session", sessionSchema);
