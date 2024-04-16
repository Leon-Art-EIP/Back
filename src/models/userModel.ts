import { Collection, IEntity } from 'fireorm';

@Collection('users')
class User implements IEntity {
  // Déclaration des propriétés avec leurs types
  id: string;
  username: string;
  email: string;
  password: string; // Mot de passe hashé, pas en texte clair
  is_artist: boolean;
  biography: string;
  availability: string;
  subscription: string;
  collections: string[];
  subscriptions: string[];
  subscribers: string[];
  subscribersCount: number;
  likedPublications: string[];
  canPostArticles: boolean;
  fcmToken: string;
  profilePicture: string;
  bannerPicture: string;
  stripeAccountId: string;

  constructor() {
    this.id = '';
    this.username = '';
    this.email = '';
    this.password = '';
    this.is_artist = false;
    this.biography = '';
    this.availability = 'unavailable';
    this.subscription = 'standard';
    this.collections = [];
    this.subscriptions = [];
    this.subscribers = [];
    this.subscribersCount = 0;
    this.likedPublications = [];
    this.canPostArticles = true;
    this.fcmToken = '';
    this.profilePicture = 'uploads/static/default-profile-pic.png';
    this.bannerPicture = 'uploads/static/default-banner-pic.png';
    this.stripeAccountId = '';
  }
}

export default User;
