const { Quiz } = require('../models/Quizz');

exports.submitQuizz = async (req, res) => {
    try {
        const userId = req.user.id;
        const quizData = req.body;

        // Add user to the quiz data
        quizData.user = userId;

        const quiz = new Quizz(quizData);
        await quiz.save();

        res.status(200).json({ msg: 'Quizz submitted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
