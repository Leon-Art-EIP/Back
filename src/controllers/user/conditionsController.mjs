import fs from 'fs';

export const getConditions = async (req, res) => {
    try {
        const conditions = await fs.readFileSync('uploads/conditions.txt', 'utf8');
        res.status(200).json({ conditions });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Server error.' });
    }
}