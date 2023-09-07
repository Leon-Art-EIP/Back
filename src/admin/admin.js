const AdminJS = require('adminjs');
const AdminJSMongoose = require('@adminjs/mongoose');
const bcrypt = require('bcrypt');

AdminJS.registerAdapter(AdminJSMongoose);

const {
  User,
  Artwork,
  Collection,
  CollectionArtwork,
  Chat,
  ChatMessage,
  Order,
  UserFollower,
  UserLike,
  UserCollection
} = require('./models/User.js');  

const options = {
  resources: [{
    resource: User,
    options: {
      properties: {
        password: { isVisible: false },
        email: { isSortable: true },
      },
      actions: {
        new: {
          before: async (request) => {
            if (request.payload.record.password) {
              const hashedPassword = await bcrypt.hash(request.payload.record.password, 10); // 10 est le nombre de "rounds" pour le salage
              request.payload.record.password = hashedPassword;
            }
                    return request;
                }
            }
        }
    }
  }, 
  Artwork, 
  Collection,
  CollectionArtwork, 
    Chat, 
    ChatMessage, 
    Order, 
    UserFollower, 
    UserLike, 
    UserCollection],
  rootPath: '/admin',
};

module.exports = options;
