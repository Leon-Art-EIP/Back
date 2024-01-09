import { User } from "../../models/userModel.mjs";

export const setupStripeAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { stripeAccountId } = req.body; // Assume this comes from Stripe onboarding process

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.stripeAccountId = stripeAccountId;
    await user.save();

    res.json({ msg: "Stripe account setup successfully", stripeAccountId });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getStripeAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ stripeAccountId: user.stripeAccountId });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
