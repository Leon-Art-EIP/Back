import { v4 as uuidv4 } from 'uuid';

class Notification {
  constructor(data) {
    this.recipient = data.recipient;
    this.type = data.type;
    this.content = data.content;
    this.referenceId = data.referenceId || null;
    this.read = data.read || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.id = data.id || uuidv4();
  }

  toJSON() {
    return {
      recipient: this.recipient,
      type: this.type,
      content: this.content,
      referenceId: this.referenceId,
      read: this.read,
      createdAt: this.createdAt,
      id: this.id,
    };
  }
}

export { Notification };