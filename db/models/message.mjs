import { Schema, model } from "mongoose";

var messageSchema = new Schema({
	author: {
		username: { type: String, required: true },
		avatar: String
	},
	content: { type: String, required: true },
	createdAt: { type: Date, default: Date.now, required: true },
	deleted: { type: Boolean, default: false }
});

messageSchema.index({ createdAt: -1 });
messageSchema.index({ deleted: 1, createdAt: -1 });
messageSchema.index({ content: "text", "author.username": "text" });

messageSchema.methods.toJson = function () {
	return {
		id: this.id,
		author: this.author,
		content: this.content,
		createdAt: this.createdAt
	};
};

messageSchema.statics.list = function (options, callback) {
	let query = this.find({ deleted: false })

	if (options.before) {
		query.where({
			createdAt: {
				$lt: new Date(options.before)
			}
		});
	}

	return query.sort({ createdAt: -1 })
		.limit(30)
		.exec((error, messages) => {
			if (error) return callback(error);
			return callback(null, messages.reverse());
		});
};

model('Message', messageSchema);
