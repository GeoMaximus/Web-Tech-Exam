import Sequelize from 'sequelize';
import db from '../dbConfig.js';

const Company = db.define("Company", {
    CompanyId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    CompanyName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            len: [3,15]
        }
    },
    CompanyDate: {
        type: Sequelize.DATE,
        allownull: true
    }
})

export default Company;