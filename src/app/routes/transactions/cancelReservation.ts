/**
 * 予約キャンセル取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const cancelReservationTransactionsRouter = Router();

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

cancelReservationTransactionsRouter.use(authentication);

cancelReservationTransactionsRouter.post(
    '/start',
    permitScopes(['admin', 'transactions']),
    (req, _, next) => {
        req.checkBody('project')
            .notEmpty()
            .withMessage('Required');
        req.checkBody('expires', 'invalid expires')
            .notEmpty()
            .withMessage('Required')
            .isISO8601();
        req.checkBody('agent', 'invalid agent')
            .notEmpty()
            .withMessage('Required');
        req.checkBody('agent.typeOf', 'invalid agent.typeOf')
            .notEmpty()
            .withMessage('Required');
        req.checkBody('agent.name', 'invalid agent.name')
            .notEmpty()
            .withMessage('Required');

        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const transaction = await chevre.service.transaction.cancelReservation.start({
                project: project,
                typeOf: chevre.factory.transactionType.CancelReservation,
                agent: {
                    typeOf: req.body.agent.typeOf,
                    // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                    name: req.body.agent.name,
                    url: req.body.agent.url
                },
                object: {
                    clientUser: req.user,
                    ...req.body.object
                },
                expires: moment(req.body.expires)
                    .toDate()
            })({
                reservation: reservationRepo,
                transaction: transactionRepo
            });
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

cancelReservationTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.cancelReservation.confirm({
                ...req.body,
                id: req.params.transactionId
            })({ transaction: transactionRepo });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

cancelReservationTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await transactionRepo.cancel({
                typeOf: chevre.factory.transactionType.CancelReservation,
                id: req.params.transactionId
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default cancelReservationTransactionsRouter;
