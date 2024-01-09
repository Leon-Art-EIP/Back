import AdminJS from 'adminjs';
import * as AdminJSMongoose from '@adminjs/mongoose';
import bcrypt from 'bcrypt';

// Importez vos modèles ici
import { User } from '../models/userModel.mjs';
import { ArtPublication } from '../models/artPublicationModel.mjs';
import { Comment } from '../models/commentModel.mjs';
import { Quizz } from '../models/quizzModel.mjs';
import { ResetToken } from '../models/resetPasswordTokenModel.mjs';
import { Article } from '../models/articleModel.mjs';
import Collection from '../models/collectionModel.mjs';
import Conversation from '../models/conversationModel.mjs';
import Message from '../models/messageModel.mjs';
import { Order } from '../models/orderModel.mjs';
import { Notification } from '../models/notificationModel.mjs';

AdminJS.registerAdapter(AdminJSMongoose);


const userNavigation = { name: "User Related", icon: "User" };
const contentNavigation = { name: "Content", icon: "Documentation" };

const options = {
  resources: [
    {
      resource: User,
      options: {
        navigation: userNavigation,
        properties: {
          password: {
            isVisible: { list: false, filter: false, show: false, edit: true },
            type: 'password',
          },
          email: { isSortable: true },
          is_artist: { isVisible: true },
          biography: { type: 'richtext' },
          availability: { isVisible: true },
          subscription: { isVisible: true },
          collections: { isVisible: false },
          subscriptions: { isVisible: false },
          subscribers: { isVisible: false },
          subscribersCount: { isVisible: true },
          likedPublications: { isVisible: false },
          canPostArticles: { isVisible: true },
          fcmToken: { isVisible: false },
          profilePicture: { isVisible: true },
          bannerPicture: { isVisible: true },
        },
        actions: /* istanbul ignore next */ {
          new: {
            before: async (request) => {
              if (request.payload.record.password) {
                const hashedPassword = await bcrypt.hash(request.payload.record.password, 10);
                request.payload.record.password = hashedPassword;
              }
              return request;
            },
          },
          edit: {
            before: async (request) => {
              if (request.payload.record.password && request.method === 'post') {
                const hashedPassword = await bcrypt.hash(request.payload.record.password, 10);
                request.payload.record.password = hashedPassword;
              }
              return request;
            },
          },
        },
      },
    },
    {
      resource: ArtPublication,
      options: {
        navigation: contentNavigation,
        properties: {
          userId: { isVisible: { list: true, filter: true, show: true, edit: true } },
          image: { isVisible: true },
          artType: { isVisible: true },
          name: { isVisible: true },
          description: { type: 'richtext' },
          dimension: { isVisible: true },
          isForSale: { isVisible: true },
          price: { isVisible: { list: true, filter: true, show: true, edit: true } },
          location: { isVisible: true },
          likes: { isVisible: false },
          comments: { isVisible: false },
        },
        actions: /* istanbul ignore next */ {
          changeSaleStatus: {
            actionType: 'record',
            label: 'Change Sale Status',
            handler: async (request, response, context) => {
              const artPub = await context.resource.findOne(context.record.id());
              artPub.isForSale = !artPub.isForSale;
              await artPub.save();
              return {
                record: artPub.toJSON(),
                notice: {
                  message: `Sale status changed to ${artPub.isForSale ? 'For Sale' : 'Not For Sale'}.`,
                  type: 'success',
                },
              };
            },
          },
        },
      },
    },
    {
      resource: Comment,
      options: {
        navigation: contentNavigation,
        properties: {
          userId: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            reference: 'User',
          },
          artPublicationId: {
            isVisible: { list: true, filter: true, show: true, edit: false },
            reference: 'ArtPublication',
          },
          text: { isVisible: true },
          createdAt: { isVisible: { list: true, filter: true, show: true, edit: false } },
        },
        actions: {
          approveComment: {
            actionType: 'record',
            label: 'Approve Comment',
            handler: async (request, response, context) => {
              // Logique pour approuver le commentaire
              return /* istanbul ignore next */ {
                record: context.record.toJSON(),
                notice: {
                  message: 'Comment approved successfully',
                  type: 'success',
                },
              };
            },
          },
          hideComment: {
            actionType: 'record',
            label: 'Hide Comment',
            handler: async (request, response, context) => {
              // Logique pour masquer le commentaire
              return /* istanbul ignore next */ {
                record: context.record.toJSON(),
                notice: {
                  message: 'Comment hidden successfully',
                  type: 'success',
                },
              };
            },
          },
          // ... autres actions personnalisées
        },
      },
    },
    { resource: Quizz, options: { navigation: contentNavigation } },
    { resource: ResetToken, options: { navigation: userNavigation } },
    { resource: Article, options: { navigation: contentNavigation } },
    { resource: Collection, options: { navigation: contentNavigation } },
    { resource: Conversation, options: { navigation: contentNavigation } },
    { resource: Message, options: { navigation: contentNavigation } },
    { resource: Order, options: { navigation: contentNavigation } },
    { resource: Notification, options: { navigation: contentNavigation } },
  ],
  rootPath: '/admin',
  branding: {
    companyName: 'LeonArt',
    theme: {
      colors: {
        primary100: '#D32F2F', // rouge foncé
        primary80: '#C62828',  // rouge un peu moins foncé
        primary60: '#B71C1C',  // rouge encore moins foncé
        primary40: '#F44336',  // rouge vif
        primary20: '#EF5350',  // rouge légèrement vif
        primary10: '#E53935',  // rouge le moins vif
        accent: '#FFFFFF',     // blanc pour les accents
      },
      // ... autres personnalisations de thème
    },
  },
};

export default options;
