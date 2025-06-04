const { ObjectId } = require('mongodb');

function createSpaceModel(db) {
  const collection = db.collection('spaces');

  return {
    create: async (space) => {
      return await collection.insertOne(space);
    },
    findById: (id) => collection.findOne({ _id: new ObjectId(id) }),
    
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

    updateDrawing: async (spaceId, strokes) => {
      return await collection.updateOne(
        { _id: new ObjectId(spaceId) },
        { $set: { strokes } } 
      );
    },

    getDrawing: async (spaceId) => {
      const space = await collection.findOne({ _id: new ObjectId(spaceId) });
      return space?.strokes || [];
    },
  };
}

module.exports = createSpaceModel;
