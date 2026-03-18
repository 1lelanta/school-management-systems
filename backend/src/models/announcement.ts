import { connectDatabase } from '../database';

export async function listAnnouncements(user: any) {
  const db = await connectDatabase();
  const announcements = await db.collection('announcements').aggregate([
    {
      $match: {
        $or: [
          { target_role: { $in: ['all', user.role] } },
          { author_id: user.id },
        ],
      },
    },
    { $lookup: { from: 'users', localField: 'author_id', foreignField: 'id', as: 'author' } },
    { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
    { $addFields: { author_name: { $concat: ['$author.first_name', ' ', '$author.last_name'] } } },
    { $sort: { created_at: -1 } },
    { $limit: 50 },
    { $project: { author: 0 } },
  ]).toArray();
  return announcements;
}

export async function createAnnouncement(payload: any) {
  const db = await connectDatabase();
  await db.collection('announcements').insertOne(payload);
}
