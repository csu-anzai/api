"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 価格仕様ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const priceSpecificationsRouter = express_1.Router();
priceSpecificationsRouter.use(authentication_1.default);
// priceSpecificationsRouter.get(
//     '/compoundPriceSpecification',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
//             const searchCoinditions: any = {
//                 // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
//                 limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
//                 page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
//                 sort: req.query.sort,
//                 typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
//                 priceComponent: req.query.priceComponent
//             };
//             const totalCount = await priceSpecificationRepo.countCompoundPriceSpecifications(searchCoinditions);
//             const priceSpecifications = await priceSpecificationRepo.searchCompoundPriceSpecifications(searchCoinditions);
//             res.set('X-Total-Count', totalCount.toString());
//             res.json(priceSpecifications);
//         } catch (error) {
//             next(error);
//         }
//     }
// );
priceSpecificationsRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const project = Object.assign({}, req.body.project, { typeOf: 'Project' });
        let priceSpecification = Object.assign({}, req.body, { project: project });
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        const doc = yield priceSpecificationRepo.priceSpecificationModel.create(priceSpecification);
        priceSpecification = doc.toObject();
        res.status(http_status_1.CREATED)
            .json(priceSpecification);
    }
    catch (error) {
        next(error);
    }
}));
priceSpecificationsRouter.get('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        const doc = yield priceSpecificationRepo.priceSpecificationModel.findById(req.params.id)
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('PriceSpecification');
        }
        const priceSpecification = doc.toObject();
        res.json(priceSpecification);
    }
    catch (error) {
        next(error);
    }
}));
priceSpecificationsRouter.put('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const priceSpecification = Object.assign({}, req.body);
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        yield priceSpecificationRepo.priceSpecificationModel.findByIdAndUpdate(req.params.id, priceSpecification)
            .exec();
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
priceSpecificationsRouter.get('', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const totalCount = yield priceSpecificationRepo.count(searchCoinditions);
        const priceSpecifications = yield priceSpecificationRepo.search(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString())
            .json(priceSpecifications);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = priceSpecificationsRouter;
