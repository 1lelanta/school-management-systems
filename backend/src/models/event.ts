import { connectDatabase } from '../database';

export async function listEvents(opts: any) {
  const { start_date, end_date, event_type } = opts || {};
  const db = await connectDatabase();
  const match: any = {};
  if (start_date) match.start_date = { $gte: start_date };
  if (end_date) match.start_date = match.start_date ? { ...match.start_date, $lte: end_date } : { $lte: end_date };
  if (event_type) match.event_type = event_type;

  const events = await db.collection('events').aggregate([
    { $match: match },
    { $lookup: { from: 'users', localField: 'created_by', foreignField: 'id', as: 'creator' } },
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
    { $addFields: { created_by_name: { $concat: ['$creator.first_name', ' ', '$creator.last_name'] } } },
    { $lookup: { from: 'classes', localField: 'class_id', foreignField: 'id', as: 'class' } },
    { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
    { $addFields: { class_name: '$class.name' } },
    { $project: { creator: 0, class: 0 } },
    { $sort: { start_date: 1 } },
  ]).toArray();
  return events;
}

export async function createEvent(payload: any) {
  const db = await connectDatabase();
  await db.collection('events').insertOne(payload);
}
