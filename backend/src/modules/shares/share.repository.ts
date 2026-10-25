import { ShareModel, IShareDocument } from './share.model';
import { IShare, ShareStatus } from './share.types';

export class ShareRepository {
  async create(data: Partial<IShare>): Promise<IShareDocument> {
    return ShareModel.create(data);
  }

  async findByShareId(shareId: string, includeSecret = false): Promise<IShareDocument | null> {
    const query = ShareModel.findOne({ shareId });
    if (includeSecret) {
      query.select('+deleteTokenHash');
    }
    return query.exec();
  }

  async findByShortCode(shortCode: string): Promise<IShareDocument | null> {
    const escaped = shortCode.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return ShareModel.findOne({
      shortCode: { $regex: new RegExp(`^${escaped}$`, 'i') }
    }).exec();
  }

  async shortCodeExists(shortCode: string): Promise<boolean> {
    const escaped = shortCode.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const count = await ShareModel.countDocuments({
      shortCode: { $regex: new RegExp(`^${escaped}$`, 'i') }
    }).exec();
    return count > 0;
  }

  async incrementViewCount(shareId: string): Promise<void> {
    await ShareModel.updateOne({ shareId }, { $inc: { viewCount: 1 } }).exec();
  }

  async incrementDownloadCount(shareId: string): Promise<void> {
    await ShareModel.updateOne({ shareId }, { $inc: { downloadCount: 1 } }).exec();
  }

  async updateStatus(shareId: string, status: ShareStatus): Promise<void> {
    await ShareModel.updateOne({ shareId }, { status }).exec();
  }

  async deletePermanently(shareId: string): Promise<void> {
    await ShareModel.deleteOne({ shareId }).exec();
  }

  async findExpiredPendingCleanup(batchSize = 50): Promise<IShareDocument[]> {
    const now = new Date();
    return ShareModel.find({
      $or: [
        { expiresAt: { $lte: now }, status: { $ne: 'deleted' } },
        { status: 'deleted', 'file.storageKey': { $exists: true, $ne: '' } }
      ]
    })
      .limit(batchSize)
      .exec();
  }
}

export const shareRepository = new ShareRepository();
