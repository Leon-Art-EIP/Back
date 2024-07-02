class Quizz {
  constructor(data) {
    this.userId = data.userId;
    this.objective = data.objective;
    this.artInterestType = data.artInterestType || [];
    this.artSellingType = data.artSellingType || [];
    this.location = data.location || "";
    this.customCommands = data.customCommands || "";
    this.budget = data.budget || "";
    this.discoveryMethod = data.discoveryMethod || "";
  }

  toJSON() {
    return {
      userId: this.userId,
      objective: this.objective,
      artInterestType: this.artInterestType,
      artSellingType: this.artSellingType,
      location: this.location,
      customCommands: this.customCommands,
      budget: this.budget,
      discoveryMethod: this.discoveryMethod
    };
  }
}

export { Quizz };
