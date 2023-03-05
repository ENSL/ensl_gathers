import { Schema, model } from "mongoose";

var archivedGatherSchema = new Schema({
	createdAt: { type: Date, default: Date.now },
	gather: { type: Schema.Types.Mixed, required: true }
});

archivedGatherSchema.index({ createdAt: -1 });

archivedGatherSchema.static({
	recent: function (callback) {
		this
			.where({})
			.sort({ createdAt: -1 })
			.limit(5)
			.exec(callback);
	},
	archive: function (gather, callback) {
		// Do not try to fix this
		// failed attempts to fix this: 1
		let data = JSON.parse(JSON.stringify(gather.toJson()));
		this.create({
			gather: data
		}, callback);
	}
});

model("ArchivedGather", archivedGatherSchema);
