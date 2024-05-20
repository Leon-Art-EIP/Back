import { Quizz } from "../../models/quizzModel.mjs";
import { User } from "../../models/userModel.mjs";

export async function submitQuizz(req, res) {
  try {
    const userId = req.user.id;
    const quizzData = req.body;

    // Add user to the quizz data
    quizzData.user = userId;

    const quizz = new Quizz(quizzData);
    await quizz.save();

    // Save the quizz result and location to the user model
    await User.findByIdAndUpdate(userId, { quizz: quizz._id, location: quizzData.location });

    res.status(200).json({ msg: "Quizz submitted successfully" });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}
