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
 * タスクルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const tasksRouter = express_1.Router();
tasksRouter.use(authentication_1.default);
/**
 * タスク作成
 */
tasksRouter.post('/:name', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('runsAt')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'required')
        .isISO8601(),
    check_1.body('remainingNumberOfTries')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'required')
        .isInt(),
    check_1.body('data')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'required')
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const project = Object.assign({}, req.body.project, { typeOf: 'Project' });
        const attributes = {
            project: project,
            name: req.params.name,
            status: chevre.factory.taskStatus.Ready,
            runsAt: moment(req.body.runsAt)
                .toDate(),
            remainingNumberOfTries: Number(req.body.remainingNumberOfTries),
            numberOfTried: 0,
            executionResults: [],
            data: req.body.data
        };
        const task = yield taskRepo.save(attributes);
        res.status(http_status_1.CREATED)
            .json(task);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * タスク確認
 */
tasksRouter.get('/:name/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const task = yield taskRepo.findById({
            name: req.params.name,
            id: req.params.id
        });
        res.json(task);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * タスク検索
 */
tasksRouter.get('', permitScopes_1.default(['admin']), ...[
    check_1.query('runsFrom')
        .optional()
        .isISO8601()
        .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
        .toDate(),
    check_1.query('runsThrough')
        .optional()
        .isISO8601()
        .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
        .toDate(),
    check_1.query('lastTriedFrom')
        .optional()
        .isISO8601()
        .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
        .toDate(),
    check_1.query('lastTriedThrough')
        .optional()
        .isISO8601()
        .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const searchConditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const tasks = yield taskRepo.search(searchConditions);
        const totalCount = yield taskRepo.count(searchConditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(tasks);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = tasksRouter;
