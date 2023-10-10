import AdminJS from 'adminjs';
import * as AdminJSMongoose from '@adminjs/mongoose';

import bcrypt from 'bcrypt';
import {
  User
} from '../models/userModel.mjs';
import { ArtPublication } from '../models/artPublicationModel.mjs';
import { Comment } from '../models/commentModel.mjs';
import { Quizz } from '../models/quizzModel.mjs';
import { ResetToken } from '../models/resetPasswordTokenModel.mjs';

AdminJS.registerAdapter(AdminJSMongoose);

const options = {
  resources: [
    {
      resource: User,
      options: {
        properties: {
          password: { isVisible: true },
          email: { isSortable: true },
        },
        actions: {
          new: {
            before: async (request) => /* istanbul ignore next */ {
              if (request.payload.record.password) {
                const hashedPassword = await bcrypt.hash(request.payload.record.password, 10);
                request.payload.record.password = hashedPassword;
              }
              return request;
            },
          },
        },
      },
      ArtPublication,
      Comment,
      Quizz,
      ResetToken,
    },
  ],
  rootPath: '/admin',
};

export default options;
