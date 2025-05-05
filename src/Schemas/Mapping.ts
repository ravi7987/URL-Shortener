import mongoose, { Schema } from 'mongoose';

const MappingSchema = new Schema(
	{
		id: {
			type: BigInt,
			required: true,
			index: true,
		},
		short_url: {
			type: String,
			required: true,
		},
		long_url: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: {
			createdAt: 'created_at',
			updatedAt: 'updated_at',
		},
		versionKey: false,
	}
);

const MappingModel = mongoose.model('mappings', MappingSchema);

export default MappingModel;
