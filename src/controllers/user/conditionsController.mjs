import fs from 'fs';
import logger from '../../config/logger.js'; // Assurez-vous que le chemin est correct

export const getConditions = async (req, res) => {
    try {
        logger.info('Fetching conditions from conditions.txt');
        const conditions = await fs.readFileSync('uploads/static/conditions.txt', 'utf8');
        res.status(200).json({ conditions });
        logger.info('Conditions fetched successfully');
    } catch (error) /* istanbul ignore next */ {
        logger.error('Error fetching conditions: %o', error);
        return res.status(500).json({ msg: 'Server error.' });
    }
};
