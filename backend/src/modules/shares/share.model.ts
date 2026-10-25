import { Schema, model, Document } from 'mongoose';
import { IShare } from './share.types';

export interface IShareDocument extends IShare, Document {}

const fileMetadataSchema = new Schema(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageKey: { type: String, required: true },
    resourceType: { type: String, default: 'raw' },
    publicUrl: { type: String }
  },
  { _id: false }
);

const shareSchema = new Schema<IShareDocument>(
  {
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    shortCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'file'],
      required: true
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100
    },
    textContent: {
      type: String
    },
    language: {
      type: String,
      default: 'plaintext'
    },
    file: {
      type: fileMetadataSchema
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'deleted'],
      default: 'active',
      index: true
    },
    viewCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    deleteTokenHash: {
      type: String,
      select: false // Never return in normal queries
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

// Compound index for cleanup queries
shareSchema.index({ status: 1, expiresAt: 1 });

export const ShareModel = model<IShareDocument>('Share', shareSchema);
