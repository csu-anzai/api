/**
 * ルーター
 */
import * as express from 'express';

import accountTitlesRouter from './accountTitles';
import creativeWorksRouter from './creativeWorks';
import eventsRouter from './events';
import placesRouter from './places';
import priceSpecificationsRouter from './priceSpecifications';
import reservationsRouter from './reservations';
import ticketTypeGroupsRouter from './ticketTypeGroups';
import ticketTypesRouter from './ticketTypes';
import transactionsRouter from './transactions';
const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/accountTitles', accountTitlesRouter);
router.use('/creativeWorks', creativeWorksRouter);
router.use('/places', placesRouter);
router.use('/events', eventsRouter);
router.use('/priceSpecifications', priceSpecificationsRouter);
router.use('/reservations', reservationsRouter);
router.use('/ticketTypeGroups', ticketTypeGroupsRouter);
router.use('/ticketTypes', ticketTypesRouter);
router.use('/transactions', transactionsRouter);

export default router;
