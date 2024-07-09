class Message {
  constructor(data) {
    this.id = data.id;
    this.senderId = data.senderId;
    this.contentType = data.contentType;
    this.content = data.content;
    this.dateTime = data.dateTime;
    this.read = data.read || false;
  }

  toJSON() {
    return {
      id: this.id,
      senderId: this.senderId,
      contentType: this.contentType,
      content: this.content,
      dateTime: this.dateTime,
      read: this.read
    };
  }
}

export default Message;
