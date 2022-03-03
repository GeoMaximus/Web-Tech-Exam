import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import {DB_USERNAME, DB_PASSWORD} from './Consts.js';
import db from './dbConfig.js';
import Company from './models/Company.js';
import Founder from './models/Founder.js';
import LikeOp from './operators.js';
import path from 'path';

let app = express();
let router = express.Router();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.use('/api', router);

let conn
mysql.createConnection({
    user: DB_USERNAME,
    password: DB_PASSWORD
})
.then((connection) => {
    conn = connection
    return connection.query('CREATE DATABASE IF NOT EXISTS exam');
})
.then( () => {
    return conn.end();
})
.catch((error) => {
    console.warn(err.stack);
})

Company.hasMany(Founder, {as: "Founders", foreignKey: "CompanyId"});
Founder.belongsTo(Company, {foreignKey: "CompanyId"});

db.sync();

async function getCompany() {
    return await Company.findAll({include: ["Founders"]});
}

async function getCompanyById(id) {
    return await Company.findByPk(id, {include: ["Founders"]});
}

async function createCompany(company) {
    return await Company.create(company, {include: [{model: Founder, as: "Founders"}]});
}

async function updateCompany(id, company) {
    let updateEntity = await getCompanyById(id);

    if(!updateEntity) {
        console.log("No such entity");
        return;
    }

    return await updateEntity.update(company, {include: [{model: Founder, as: "Founders"}]});
}

async function deleteCompany(id) {
    let deleteEntity = await getCompanyById(id);

    if(!deleteEntity) {
        console.log("There si no such company");
        return;
    }

    return await deleteEntity.destroy();
}

async function getFounder() {
    return await Founder.findAll();
}

/* async function getFounderById(id) {
    return await Founder.findAll(Founder.CompanyId);
}

async function createFounder(founder) {
    return await Founder.create(founder);
} */

async function filterCompany(filter) {
    let whereClause = {};
    if(filter.CompanyName){
        whereClause.CompanyName = {[LikeOp]: `%${filter.CompanyName}%`};
    
    let whereIncludeClause = {}

    if(filter.FounderName) {
        whereIncludeClause.FounderName = {[LikeOp]: `%${filter.CompanyName}`};
    }
        return await Company.findAll({
            include:[
                {
                    model:Founder,
                    as: "Founders",
                    where: whereIncludeClause
                }
            ],
        where: whereClause
    });
    }
}

router.route('/company').get( async(req, res) => {
    return res.json(await getCompany());
});

router.route('/company/:id').get( async (req, res) => {
    return res.json(await getCompanyById(req.params.id));
});

router.route('/company').post( async(req, res) => {
    return res.json(await createCompany(req.body));
});

router.route('/company/:id').put( async (req, res) => {
    return res.json(await updateCompany(req.params.id, req.body));
});

router.route('/company/:id').delete( async (req, res) => {
    return res.json(await deleteCompany(req.params.id));
});

//Get the founders of a company !!!!!!NOT WORKING!!!!!!NOT WORKING!!!!!!
router.route('/company/:companyId/founders').get( async (req, res, next) =>{
    try{
        const company = await Company.findByPk(req.params.companyId, {
        include: [{model: Founder, as: "Founders"}]});
        if(company){
            res.status(200).json(getFounder());
        } else {
            res.status(404).json({message: 'company not found'});
        }
    } catch(error){
        next(error);
    }
});


//Post a founder into a company
router.route('/company/:companyId/founders').post( async (req, res, next) => {
    try {
        const company = await Company.findByPk(req.params.companyId);
    if(company) {
        const founder = new Founder(req.body);
        founder.CompanyId = company.CompanyId;
        await founder.save();
        res.status(201).json({message: 'Created'});
    }
    else {
        res.status(404).json({message: 'Not found'});
    }
    } catch(error) {
        next(error);
    }
});

//Put to update a founder
router.route('/company/:companyId/founders/:founderId').put( async (req, res, next) => {
    try{
        const company = await Company.findByPk(req.params.companyId);
        if(company) {
            const founders = await company.getFounders({ FounderId: req.params.founderId});
            const founder = founders.shift();
            if(founder){
                founder.founderName = req.body.FounderName;
                founder.founderRole = req.body.FounderRole;
                await founder.save();
                res.status(202).json({message: "Updated"});
            } else{
                res.status(404).json({message: "Not found"});
            }
        } else {
            res.status(404).json({ message: "No such company"});
        }
    } catch (error){
        next(error);
    }
});

//delete a founder through a company
router.route('/company/:companyId/founders/:founderId').delete( async(req, res, next) => {
    try{
        const company = await Company.findByPk(req.params.companyId);
        if(company){
            const deleteEntitys = await company.getFounders({ FounderId: req.params.founderId});
            const deleteEntity = deleteEntitys.shift();
            if(deleteEntity){
            await deleteEntity.destroy();
            res.status(202).json({message: "Deleted"});
            } else {
                res.status(404).json({message: "Not found"});
            }
        } else {
            res.status(404).json({ message: "No such company"});
        }

    }catch(error){
        next(error)
    }
});

router.route('/companyFilter').get( async(req,res) => {
    return res.json(await filterCompany(req.query));
});

router.route('/').get( async (req, res)=> {
    let path = path.resolve();
    res.sendFile(path.join(path, "build", "Index.html"));
});

let port = process.env.PORT || 8000;
app.listen(port);
console.log(`API is running at port ${port}`);

