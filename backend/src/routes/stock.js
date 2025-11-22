import { Router } from "express";
import { getStock, initStock, moveStock, increaseStock, decreaseStock, adjustStockHandler } from "../controllers/stockController.js";
const router = Router();

router.get("/", getStock);
router.post("/init", initStock);           // create/set initial quantity
router.post("/increase", increaseStock);   // receipts
router.post("/decrease", decreaseStock);   // deliveries
router.post("/move", moveStock);           // transfer
router.post("/adjust", adjustStockHandler);// adjustments

export default router;
