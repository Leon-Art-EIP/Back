class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.is_artist = data.is_artist || false;
    this.biography = data.biography || '';
    this.availability = data.availability || 'unavailable';
    this.subscription = data.subscription || 'standard';
    this.collections = data.collections || [];
    this.subscriptions = data.subscriptions || [];
    this.subscribers = data.subscribers || [];
    this.subscribersCount = data.subscribersCount || 0;
    this.likedPublications = data.likedPublications || [];
    this.canPostArticles = data.canPostArticles || true;
    this.fcmToken = data.fcmToken || '';
    this.profilePicture = data.profilePicture || 'uploads/static/default-profile-pic.png';
    this.bannerPicture = data.bannerPicture || 'uploads/static/default-banner-pic.png';
    this.stripeAccountId = data.stripeAccountId || '';
    this.averageRating = data.averageRating || null;
    this.socialMediaLinks = {
      instagram: data.socialMediaLinks?.instagram || '',
      twitter: data.socialMediaLinks?.twitter || '',
      facebook: data.socialMediaLinks?.facebook || '',
      tiktok: data.socialMediaLinks?.tiktok || '',
    };
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      password: this.password,
      is_artist: this.is_artist,
      biography: this.biography,
      availability: this.availability,
      subscription: this.subscription,
      collections: this.collections,
      subscriptions: this.subscriptions,
      subscribers: this.subscribers,
      subscribersCount: this.subscribersCount,
      likedPublications: this.likedPublications,
      canPostArticles: this.canPostArticles,
      fcmToken: this.fcmToken,
      profilePicture: this.profilePicture,
      bannerPicture: this.bannerPicture,
      stripeAccountId: this.stripeAccountId,
      averageRating: this.averageRating,
      socialMediaLinks: this.socialMediaLinks,
    };
  }
}

export { User };
