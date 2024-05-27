import { Quizz } from "../../models/quizzModel.mjs";
import { User } from "../../models/userModel.mjs";

export async function submitQuizz(req, res) {
  try {
    const userId = req.user.id;
    const quizzData = req.body;

    console.log(userId);

    // Add userId to the quizz data
    quizzData.userId = userId;

    console.log(quizzData);

    const quizz = new Quizz(quizzData);
    await quizz.save();

    console.log(quizz.id);
    // Save the quizz result and location to the user model
    await User.findByIdAndUpdate(userId, { quizz: quizz.id, location: quizzData.location });

    res.status(200).json({ msg: "Quizz submitted successfully" });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}
