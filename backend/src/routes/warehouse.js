import { Router } from "express";
import { createWarehouse, listWarehouses } from "../controllers/warehouseController.js";
const router = Router();
router.post("/", createWarehouse);
router.get("/", listWarehouses);
export default router;
