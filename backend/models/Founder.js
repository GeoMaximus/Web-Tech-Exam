import Sequelize from 'sequelize';
import db from '../dbConfig.js';

const Founder = db.define("Founder", {
    FounderId: { 
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
    },
    FounderName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            len: [5,15]
        }
    },
    FounderRole: {
        type: Sequelize.STRING,
        allowNull: false
    },
    CompanyId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }

})

export default Founder;