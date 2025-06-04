const { ObjectId } = require('mongodb');

function createSpaceModel(db) {
  const collection = db.collection('spaces');

  return {
    create: async (space) => {
      return await collection.insertOne(space);
    },
    findById: (id) => db.collection('spaces').findOne({ _id: new ObjectId(id) }),
    findByUserId: async (userId) => {
      return await collection.find({ members: userId }).toArray();
    },
    findByCode: async (code) => {
      return await collection.findOne({ code });
    },
    addUserToSpace: async (code, userId) => {
      return await collection.updateOne(
        { code },
        { $addToSet: { members: userId } }
      );
    },
    updateDrawing: async (spaceId, drawingData) => {
      return await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { $set: { drawing: drawingData } }
      );
    },
    getDrawing: async (spaceId) => {
      const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) });
      return space?.drawing || null;
    }
  };
}

module.exports = createSpaceModel;
