class ResetToken {
  constructor(data) {
    this.email = data.email;
    this.token = data.token;
    this.expire_at = data.expire_at || new Date();
  }

  toJSON() {
    return {
      email: this.email,
      token: this.token,
      expire_at: this.expire_at
    };
  }
}

export { ResetToken };
