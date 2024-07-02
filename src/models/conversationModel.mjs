class Conversation {
  constructor(data) {
    this._id = data._id;
    this.lastMessage = data.lastMessage;
    this.unreadMessages = data.unreadMessages || false;
    this.UserOneId = data.UserOneId;
    this.UserOneName = data.UserOneName;
    this.UserOnePicture = data.UserOnePicture;
    this.UserTwoId = data.UserTwoId;
    this.UserTwoName = data.UserTwoName;
    this.UserTwoPicture = data.UserTwoPicture;
  }

  toJSON() {
    return {
      _id: this._id,
      lastMessage: this.lastMessage,
      unreadMessages: this.unreadMessages,
      UserOneId: this.UserOneId,
      UserOneName: this.UserOneName,
      UserOnePicture: this.UserOnePicture,
      UserTwoId: this.UserTwoId,
      UserTwoName: this.UserTwoName,
      UserTwoPicture: this.UserTwoPicture
    };
  }
}

export default Conversation;
