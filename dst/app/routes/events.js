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
 * イベントルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const screeningEvent_1 = require("./events/screeningEvent");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const redis = require("../../redis");
const eventsRouter = express_1.Router();
eventsRouter.use(authentication_1.default);
eventsRouter.use('/screeningEvent', screeningEvent_1.default);
const MAX_NUM_EVENTS_CREATED = 200;
/**
 * イベントに対するバリデーション
 */
const validations = [
    (req, _, next) => {
        // 単一リソース、複数リソースの両方に対応するため、bodyがオブジェクトの場合配列に変換
        req.body = (Array.isArray(req.body)) ? req.body : [req.body];
        next();
    },
    check_1.body()
        .isArray()
        .custom((value) => value.length <= MAX_NUM_EVENTS_CREATED)
        .withMessage(() => 'Array length max exceeded'),
    check_1.body('*.project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('*.typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('*.eventStatus')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('*.name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('*.doorTime')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('*.startDate')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    check_1.body('*.endDate')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    check_1.body('*.workPerformed')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('*.location')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.oneOf([
        [
            check_1.body('*.typeOf')
                .equals(chevre.factory.eventType.ScreeningEvent),
            check_1.body('*.superEvent')
                .not()
                .isEmpty()
                .withMessage((_, __) => 'Required'),
            check_1.body('*.offers')
                .not()
                .isEmpty()
                .withMessage((_, __) => 'Required'),
            check_1.body('*.offers.availabilityStarts')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate(),
            check_1.body('*.offers.availabilityEnds')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate(),
            check_1.body('*.offers.validFrom')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate(),
            check_1.body('*.offers.validThrough')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate()
        ],
        [
            check_1.body('*.typeOf')
                .equals(chevre.factory.eventType.ScreeningEventSeries)
        ]
    ])
];
/**
 * イベント作成
 */
eventsRouter.post('', permitScopes_1.default(['admin']), ...validations, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const params = req.body.map((a) => {
            const project = Object.assign({}, a.project, { typeOf: 'Project' });
            return Object.assign({}, a, { project: project });
        });
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const events = yield eventRepo.createMany(params);
        yield Promise.all(events.map((event) => __awaiter(this, void 0, void 0, function* () {
            if (event.typeOf === chevre.factory.eventType.ScreeningEvent) {
                const aggregateTask = {
                    project: event.project,
                    name: chevre.factory.taskName.AggregateScreeningEvent,
                    status: chevre.factory.taskStatus.Ready,
                    runsAt: new Date(),
                    remainingNumberOfTries: 3,
                    numberOfTried: 0,
                    executionResults: [],
                    data: event
                };
                const taskRepo = new chevre.repository.Task(mongoose.connection);
                yield taskRepo.save(aggregateTask);
            }
        })));
        res.status(http_status_1.CREATED)
            .json(events);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * イベント検索
 */
eventsRouter.get('', permitScopes_1.default(['admin', 'events', 'events.read-only']), ...[
    check_1.query('typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.query('inSessionFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('inSessionThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('startFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('startThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('endFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('endThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.availableFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.availableThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.validFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.validThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const events = yield eventRepo.search(searchCoinditions);
        const totalCount = yield eventRepo.count(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString())
            .json(events);
    }
    catch (error) {
        next(error);
    }
}));
eventsRouter.get('/withAggregateReservation', permitScopes_1.default(['admin']), ...[
    check_1.query('typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.query('inSessionFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('inSessionThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('startFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('startThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('endFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('endThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.availableFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.availableThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.validFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.validThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        // イベント検索
        const searchCoinditions = Object.assign({}, req.query, { typeOf: chevre.factory.eventType.ScreeningEvent, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const events = yield eventRepo.search(searchCoinditions);
        const totalCount = yield eventRepo.count(searchCoinditions);
        const eventsWithAggregation = yield Promise.all(events.map((e) => __awaiter(this, void 0, void 0, function* () {
            const aggregation = yield chevre.service.aggregation.aggregateEventReservation({
                id: e.id
            })({
                reservation: reservationRepo
            });
            return Object.assign({}, e, aggregation, { preSaleTicketCount: aggregation.advanceTicketCount });
        })));
        res.set('X-Total-Count', totalCount.toString())
            .json(eventsWithAggregation);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * IDでイベント検索
 */
eventsRouter.get('/:id', permitScopes_1.default(['admin', 'events', 'events.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const event = yield eventRepo.findById({
            id: req.params.id
        });
        res.json(event);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * イベント更新
 */
eventsRouter.put('/:id', permitScopes_1.default(['admin']), ...validations, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventAttributes = req.body[0];
        const upsert = req.query.upsert === 'true';
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const event = yield eventRepo.save({
            id: req.params.id,
            attributes: eventAttributes,
            upsert: upsert
        });
        if (event.typeOf === chevre.factory.eventType.ScreeningEvent) {
            const aggregateTask = {
                project: event.project,
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                numberOfTried: 0,
                executionResults: [],
                data: event
            };
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            yield taskRepo.save(aggregateTask);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * イベントに対する座席オファー検索
 */
eventsRouter.get('/:id/offers', permitScopes_1.default(['admin', 'events', 'events.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        let offers = [];
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const event = yield eventRepo.findById({
            id: req.params.id
        });
        // 座席指定利用可能かどうか
        const reservedSeatsAvailable = !(event.offers !== undefined
            && event.offers.itemOffered !== undefined
            && event.offers.itemOffered.serviceOutput !== undefined
            && event.offers.itemOffered.serviceOutput.reservedTicket !== undefined
            && event.offers.itemOffered.serviceOutput.reservedTicket.ticketedSeat === undefined);
        if (reservedSeatsAvailable) {
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const unavailableOffers = yield eventAvailabilityRepo.findUnavailableOffersByEventId({ eventId: req.params.id });
            const movieTheater = yield placeRepo.findById({ id: event.superEvent.location.id });
            const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === event.location.branchCode);
            if (screeningRoom === undefined) {
                throw new chevre.factory.errors.NotFound('Screening Room');
            }
            offers = screeningRoom.containsPlace;
            offers.forEach((offer) => {
                const seats = offer.containsPlace;
                const seatSection = offer.branchCode;
                seats.forEach((seat) => {
                    const seatNumber = seat.branchCode;
                    const unavailableOffer = unavailableOffers.find((o) => o.seatSection === seatSection && o.seatNumber === seatNumber);
                    seat.offers = [{
                            typeOf: 'Offer',
                            priceCurrency: chevre.factory.priceCurrency.JPY,
                            availability: (unavailableOffer !== undefined)
                                ? chevre.factory.itemAvailability.OutOfStock
                                : chevre.factory.itemAvailability.InStock
                        }];
                });
            });
        }
        res.json(offers);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * イベントに対するチケットオファー検索
 */
eventsRouter.get('/:id/offers/ticket', permitScopes_1.default(['admin', 'events', 'events.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const offers = yield chevre.service.offer.searchScreeningEventTicketOffers({ eventId: req.params.id })({
            event: eventRepo,
            offer: offerRepo,
            priceSpecification: priceSpecificationRepo
        });
        res.json(offers);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = eventsRouter;
