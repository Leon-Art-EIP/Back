import AdminJS from 'adminjs';
import * as AdminJSMongoose from '@adminjs/mongoose';

import bcrypt from 'bcrypt';
import {
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
} from '../models/UserModel.mjs';

AdminJS.registerAdapter(AdminJSMongoose);

const options = {
  resources: [
    {
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
                const hashedPassword = await bcrypt.hash(request.payload.record.password, 10);
                request.payload.record.password = hashedPassword;
              }
              return request;
            },
          },
        },
      },
    },
    Artwork,
    Collection,
    CollectionArtwork,
    Chat,
    ChatMessage,
    Order,
    UserFollower,
    UserLike,
    UserCollection,
  ],
  rootPath: '/admin',
};

export default options;
