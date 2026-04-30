import { Router } from 'express';
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,

} from '../controllers/invoice.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);


export default router;