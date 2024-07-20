export default async () => {
  if (global.testEnv) {
    await global.testEnv.cleanup();
  }
};
